"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useProfile } from "@/hooks/useProfile";
import {
  getAdminEarnings,
  type AdminEarningsResponse,
  type AdminEarningsTotals,
} from "@/services/earnings/earnings.service";
import Button from "@/components/ui/button/Button";

const DEFAULT_CURRENCY_ALL = "ALL" as const;

const formatCents = (cents: number): string => {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  const dollars = Math.floor(abs / 100);
  const remainder = abs % 100;
  return `${sign}${dollars.toLocaleString()}.${String(remainder).padStart(2, "0")}`;
};

const formatDateInputToIsoStart = (value: string): string => {
  const [year, month, day] = value.split("-").map((v) => Number(v));
  const date = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  return date.toISOString();
};

const formatDateInputToIsoExclusiveEnd = (value: string): string => {
  const [year, month, day] = value.split("-").map((v) => Number(v));
  const date = new Date(Date.UTC(year, month - 1, day + 1, 0, 0, 0, 0));
  return date.toISOString();
};

type StatusBadgeProps = {
  readonly label: string;
  readonly count: number;
};

const StatusBadge = (props: StatusBadgeProps): React.ReactNode => {
  const { label, count } = props;
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs text-gray-700 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-200">
      <span className="font-medium">{label}</span>
      <span className="text-gray-500 dark:text-gray-400">({count})</span>
    </span>
  );
};

const TotalsCard = (props: { readonly totals: AdminEarningsTotals }) => {
  const { totals } = props;
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
            Totals ({totals.currency})
          </p>
          {totals.isEstimated ? (
            <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
              Some splits were estimated (missing metadata).
            </p>
          ) : null}
        </div>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-400">Gross (net)</p>
          <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
            {formatCents(totals.grossNetCents)}
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Paid {formatCents(totals.grossPaidCents)} · Refunded{" "}
            {formatCents(totals.grossRefundedCents)}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Platform fee (net)
          </p>
          <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
            {formatCents(totals.platformFeeNetCents)}
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Paid {formatCents(totals.platformFeePaidCents)} · Refunded{" "}
            {formatCents(totals.platformFeeRefundedCents)}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Trainer share (net)
          </p>
          <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
            {formatCents(totals.trainerShareNetCents)}
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Paid {formatCents(totals.trainerSharePaidCents)} · Refunded{" "}
            {formatCents(totals.trainerShareRefundedCents)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default function EarningsContent(): React.ReactNode {
  const { user, isLoading: isProfileLoading } = useProfile();

  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [currency, setCurrency] = useState<string>(DEFAULT_CURRENCY_ALL);

  const [data, setData] = useState<AdminEarningsResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const isAdmin = user?.role === "ADMIN";

  const availableCurrencies = useMemo(() => {
    const currencies = new Set<string>();
    for (const t of data?.totals ?? []) {
      currencies.add(t.currency);
    }
    return Array.from(currencies).sort((a, b) => a.localeCompare(b));
  }, [data?.totals]);

  const filteredTotals = useMemo(() => {
    if (!data) return [];
    if (currency === DEFAULT_CURRENCY_ALL) return data.totals;
    return data.totals.filter((t) => t.currency === currency);
  }, [currency, data]);

  const filteredTrainees = useMemo(() => {
    if (!data) return [];
    if (currency === DEFAULT_CURRENCY_ALL) return data.trainees;
    return data.trainees.filter((t) => t.currency === currency);
  }, [currency, data]);

  const filteredTrainers = useMemo(() => {
    if (!data) return [];
    if (currency === DEFAULT_CURRENCY_ALL) return data.trainers;
    return data.trainers.filter((t) => t.currency === currency);
  }, [currency, data]);

  const handleLoad = useCallback(async () => {
    if (!isAdmin) return;
    setIsLoading(true);
    setError(null);
    try {
      const from = fromDate ? formatDateInputToIsoStart(fromDate) : undefined;
      const to = toDate ? formatDateInputToIsoExclusiveEnd(toDate) : undefined;
      const currencyParam =
        currency === DEFAULT_CURRENCY_ALL ? undefined : currency;
      const result = await getAdminEarnings({
        from,
        to,
        currency: currencyParam,
      });
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load earnings"));
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [currency, fromDate, isAdmin, toDate]);

  useEffect(() => {
    if (isProfileLoading) return;
    if (!isAdmin) return;
    void handleLoad();
  }, [handleLoad, isAdmin, isProfileLoading]);

  if (isProfileLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="text-sm text-gray-500 dark:text-gray-400">
          Loading profile...
        </span>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="rounded-lg border border-error-500/30 bg-error-50 p-4 dark:border-error-500/20 dark:bg-error-500/10">
        <p className="text-sm text-error-600 dark:text-error-500">
          You do not have permission to view finance.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h4 className="text-base font-semibold text-gray-800 dark:text-white/90">
              Filters
            </h4>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Date filters apply to paidAt (PAID) and refundedAt (REFUNDED).
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={handleLoad}
            disabled={isLoading}
            aria-label="Refresh finance"
          >
            {isLoading ? "Loading..." : "Refresh"}
          </Button>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="space-y-1">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
              From
            </span>
            <input
              aria-label="From date"
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-brand-500 dark:border-gray-800 dark:bg-gray-900 dark:text-white"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
              To
            </span>
            <input
              aria-label="To date"
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-brand-500 dark:border-gray-800 dark:bg-gray-900 dark:text-white"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
              Currency
            </span>
            <select
              aria-label="Currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-brand-500 dark:border-gray-800 dark:bg-gray-900 dark:text-white"
            >
              <option value={DEFAULT_CURRENCY_ALL}>All</option>
              {availableCurrencies.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-error-500/30 bg-error-50 p-4 dark:border-error-500/20 dark:bg-error-500/10">
          <p className="text-sm text-error-600 dark:text-error-500">
            {error.message}
          </p>
        </div>
      ) : null}

      <div className="space-y-4">
        {filteredTotals.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-5 text-sm text-gray-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400">
            No payments found for the selected filters.
          </div>
        ) : (
          filteredTotals.map((t) => <TotalsCard key={t.currency} totals={t} />)
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <h4 className="text-base font-semibold text-gray-800 dark:text-white/90">
            Trainees who paid
          </h4>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">
                    Trainee
                  </th>
                  <th className="px-3 py-2 text-right font-medium text-gray-600 dark:text-gray-300">
                    Paid count
                  </th>
                  <th className="px-3 py-2 text-right font-medium text-gray-600 dark:text-gray-300">
                    Gross (net)
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredTrainees.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-3 py-6 text-center text-gray-500 dark:text-gray-400"
                    >
                      No trainee payments.
                    </td>
                  </tr>
                ) : (
                  filteredTrainees.map((row) => (
                    <tr
                      key={`${row.currency}:${row.traineeId}`}
                      className="border-b border-gray-100 last:border-b-0 dark:border-gray-800"
                    >
                      <td className="px-3 py-3">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {row.traineeName || row.traineeEmail || row.traineeId}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {row.traineeEmail}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-right text-gray-900 dark:text-white">
                        {row.paidCount}
                      </td>
                      <td className="px-3 py-3 text-right font-medium text-gray-900 dark:text-white">
                        {formatCents(row.grossNetCents)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <h4 className="text-base font-semibold text-gray-800 dark:text-white/90">
            Trainers paid (share)
          </h4>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">
                    Trainer
                  </th>
                  <th className="px-3 py-2 text-right font-medium text-gray-600 dark:text-gray-300">
                    Share (net)
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">
                    Payout
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredTrainers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-3 py-6 text-center text-gray-500 dark:text-gray-400"
                    >
                      No trainer share entries.
                    </td>
                  </tr>
                ) : (
                  filteredTrainers.map((row) => (
                    <tr
                      key={`${row.currency}:${row.trainerId}`}
                      className="border-b border-gray-100 last:border-b-0 dark:border-gray-800"
                    >
                      <td className="px-3 py-3">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {row.trainerName || row.trainerEmail || row.trainerId}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {row.trainerEmail}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-right font-medium text-gray-900 dark:text-white">
                        {formatCents(row.trainerShareNetCents)}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(row.payout.statusCounts).length === 0 ? (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              —
                            </span>
                          ) : (
                            Object.entries(row.payout.statusCounts).map(
                              ([status, count]) => (
                                <StatusBadge
                                  key={status}
                                  label={status}
                                  count={count}
                                />
                              ),
                            )
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

