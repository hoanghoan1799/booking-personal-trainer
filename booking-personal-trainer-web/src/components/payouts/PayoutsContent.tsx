"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useProfile } from "@/hooks/useProfile";
import { getErrorMessage } from "@/lib/error.utils";
import Button from "@/components/ui/button/Button";
import {
  getMyTrainerPayouts,
  type TrainerPayoutsResponse,
  type TrainerPayoutsCurrencySummary,
} from "@/services/payments/trainer-payouts.service";
import { createTrainerStripeConnectOnboardingLink } from "@/services/payments/trainer-stripe-connect.service";
import { useToast } from "@/context/ToastContext";
import {
  dateInputToUtcIsoExclusiveEndNextUtcDay,
  dateInputToUtcIsoStartOfUtcDay,
} from "@/lib/date-time/utc-date-time.helper";

const DEFAULT_CURRENCY_ALL = "ALL" as const;

const formatCents = (cents: number): string => {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  const dollars = Math.floor(abs / 100);
  const remainder = abs % 100;
  return `${sign}${dollars.toLocaleString()}.${String(remainder).padStart(2, "0")}`;
};

const formatDateInputToIsoStart = (value: string): string => {
  return dateInputToUtcIsoStartOfUtcDay(value);
};

const formatDateInputToIsoExclusiveEnd = (value: string): string => {
  return dateInputToUtcIsoExclusiveEndNextUtcDay(value);
};

const SummaryCard = (props: { readonly summary: TrainerPayoutsCurrencySummary }) => {
  const { summary } = props;
  const pendingCount =
    (summary.payoutStatusCounts.AWAITING_TRAINER_CONNECT ?? 0) +
    (summary.payoutStatusCounts.UNKNOWN ?? 0);
  const transferredCount = summary.payoutStatusCounts.TRANSFERRED ?? 0;
  const failedCount = summary.payoutStatusCounts.FAILED ?? 0;
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
            Payouts ({summary.currency})
          </p>
          {summary.isEstimated ? (
            <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
              Some values were estimated (missing metadata).
            </p>
          ) : null}
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500 dark:text-gray-400">Net earned</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {formatCents(summary.netTrainerShareCents)}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-400">Pending</p>
          <p className="mt-1 text-base font-semibold text-gray-900 dark:text-white">
            {pendingCount}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-400">Transferred</p>
          <p className="mt-1 text-base font-semibold text-gray-900 dark:text-white">
            {transferredCount}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-400">Failed</p>
          <p className="mt-1 text-base font-semibold text-gray-900 dark:text-white">
            {failedCount}
          </p>
        </div>
      </div>
    </div>
  );
};

export default function PayoutsContent(): React.ReactNode {
  const { user, isLoading: isProfileLoading, updateUser } = useProfile();
  const toast = useToast();

  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [currency, setCurrency] = useState<string>(DEFAULT_CURRENCY_ALL);

  const [data, setData] = useState<TrainerPayoutsResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);

  const isTrainer = user?.role === "TRAINER";
  const hasStripeConnect = Boolean(user?.stripeAccountId);

  const availableCurrencies = useMemo(() => {
    const currencies = new Set<string>();
    for (const s of data?.summary ?? []) {
      currencies.add(s.currency);
    }
    return Array.from(currencies).sort((a, b) => a.localeCompare(b));
  }, [data?.summary]);

  const filteredSummary = useMemo(() => {
    if (!data) return [];
    if (currency === DEFAULT_CURRENCY_ALL) return data.summary;
    return data.summary.filter((s) => s.currency === currency);
  }, [currency, data]);

  const filteredRows = useMemo(() => {
    if (!data) return [];
    if (currency === DEFAULT_CURRENCY_ALL) return data.rows;
    return data.rows.filter((r) => r.currency === currency);
  }, [currency, data]);

  const handleLoad = useCallback(async () => {
    if (!isTrainer) return;
    setIsLoading(true);
    setError(null);
    try {
      const from = fromDate ? formatDateInputToIsoStart(fromDate) : undefined;
      const to = toDate ? formatDateInputToIsoExclusiveEnd(toDate) : undefined;
      const currencyParam =
        currency === DEFAULT_CURRENCY_ALL ? undefined : currency;
      const result = await getMyTrainerPayouts({ from, to, currency: currencyParam });
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load payouts"));
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [currency, fromDate, isTrainer, toDate]);

  useEffect(() => {
    if (isProfileLoading) return;
    if (!isTrainer) return;
    void handleLoad();
  }, [handleLoad, isProfileLoading, isTrainer]);

  const handleConnectStripe = useCallback(async () => {
    if (!isTrainer) return;
    if (hasStripeConnect) return;
    if (isConnecting) return;
    setIsConnecting(true);
    try {
      const result = await createTrainerStripeConnectOnboardingLink();
      updateUser({ stripeAccountId: result.stripeAccountId });
      if (typeof window !== "undefined") {
        window.location.href = result.url;
      }
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not start Stripe Connect onboarding"));
    } finally {
      setIsConnecting(false);
    }
  }, [hasStripeConnect, isConnecting, isTrainer, toast, updateUser]);

  if (isProfileLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="text-sm text-gray-500 dark:text-gray-400">
          Loading profile...
        </span>
      </div>
    );
  }

  if (!isTrainer) {
    return (
      <div className="rounded-lg border border-error-500/30 bg-error-50 p-4 dark:border-error-500/20 dark:bg-error-500/10">
        <p className="text-sm text-error-600 dark:text-error-500">
          You do not have permission to view payouts.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!hasStripeConnect ? (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-50 p-5 dark:border-amber-500/20 dark:bg-amber-500/10">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                Connect Stripe to receive payouts
              </p>
              <p className="mt-1 text-sm text-amber-900/80 dark:text-amber-200/80">
                Your earnings will stay pending until you complete Stripe Connect onboarding.
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={handleConnectStripe}
              disabled={isConnecting}
              aria-label="Connect Stripe to receive payouts"
            >
              {isConnecting ? "Opening…" : "Connect Stripe"}
            </Button>
          </div>
        </div>
      ) : null}

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h4 className="text-base font-semibold text-gray-800 dark:text-white/90">
              Filters
            </h4>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Filters apply to paidAt/refundedAt timestamps.
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={handleLoad}
            disabled={isLoading}
            aria-label="Refresh payouts"
          >
            {isLoading ? "Loading…" : "Refresh"}
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
        {filteredSummary.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-5 text-sm text-gray-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400">
            No payout records found for the selected filters.
          </div>
        ) : (
          filteredSummary.map((s) => <SummaryCard key={s.currency} summary={s} />)
        )}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        <h4 className="text-base font-semibold text-gray-800 dark:text-white/90">
          Latest payouts
        </h4>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800">
                <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">
                  Status
                </th>
                <th className="px-3 py-2 text-right font-medium text-gray-600 dark:text-gray-300">
                  Share
                </th>
                <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">
                  Transfer
                </th>
                <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">
                  Error
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-3 py-6 text-center text-gray-500 dark:text-gray-400"
                  >
                    No rows.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => (
                  <tr
                    key={row.paymentId}
                    className="border-b border-gray-100 last:border-b-0 dark:border-gray-800"
                  >
                    <td className="px-3 py-3 font-medium text-gray-900 dark:text-white">
                      {row.status}
                    </td>
                    <td className="px-3 py-3 text-right font-medium text-gray-900 dark:text-white">
                      {formatCents(row.trainerShareCents)} {row.currency}
                    </td>
                    <td className="px-3 py-3 text-gray-700 dark:text-gray-200">
                      {row.transferId ?? "—"}
                    </td>
                    <td className="px-3 py-3 text-gray-500 dark:text-gray-400">
                      {row.errorMessage ?? "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

