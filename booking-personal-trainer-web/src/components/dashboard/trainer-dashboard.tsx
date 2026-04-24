"use client";

import type React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalenderIcon, DollarLineIcon, GroupIcon, TaskIcon } from "@/icons";
import { APP_ROUTES } from "@/lib/route.constants";
import { getUtcRangeIso } from "@/lib/report-date-range";
import { formatCents } from "@/lib/format-money";
import { useProfile } from "@/hooks/useProfile";
import { useBookings } from "@/hooks/useBookings";
import { useWorkouts } from "@/hooks/useWorkouts";
import {
  getTrainerKpiReport,
  getTrainerLoyalUsers,
  getTrainerRevenueReport,
  type LoyalUserRow,
  type RevenueBucketRow,
  type TrainerKpiRow,
} from "@/services/reporting/reporting.service";
import Button from "@/components/ui/button/Button";
import { DashboardSection } from "./dashboard-section";
import { DashboardStatCard } from "./dashboard-stat-card";
import { DashboardStateMessage } from "./dashboard-state-message";
import { TikTokQuickAccessCard } from "./tiktok-quick-access-card";
import { BookingsTable } from "./bookings-table";
import { WorkoutsTable } from "./workouts-table";
import { RevenueBucketsTable } from "./revenue-buckets-table";
import { LoyalUsersTable } from "./loyal-users-table";

const REPORT_RANGE_DAYS = 90;
const PREVIEW_BOOKINGS = 15;
const PREVIEW_WORKOUTS = 20;

export const TrainerDashboard = (): React.ReactNode => {
  const { user } = useProfile();
  const { bookings, isLoading: bookingsLoading, error: bookingsError } = useBookings();
  const {
    workouts,
    isLoading: workoutsLoading,
    error: workoutsError,
    refetch: refetchWorkouts,
  } = useWorkouts({ limit: PREVIEW_WORKOUTS });
  const range = useMemo(() => getUtcRangeIso(REPORT_RANGE_DAYS), []);
  const [reportLoading, setReportLoading] = useState(true);
  const [reportError, setReportError] = useState<Error | null>(null);
  const [revenueBuckets, setRevenueBuckets] = useState<RevenueBucketRow[]>([]);
  const [kpiRow, setKpiRow] = useState<TrainerKpiRow | null>(null);
  const [loyalUsers, setLoyalUsers] = useState<LoyalUserRow[]>([]);

  const loadReports = useCallback(async () => {
    setReportLoading(true);
    setReportError(null);
    try {
      const [revenue, kpiList, loyal] = await Promise.all([
        getTrainerRevenueReport({
          from: range.from,
          to: range.to,
          currency: "USD",
          bucket: "MONTH",
        }),
        getTrainerKpiReport({
          from: range.from,
          to: range.to,
          currency: "USD",
        }),
        getTrainerLoyalUsers({ from: range.from, to: range.to, limit: 15 }),
      ]);
      setRevenueBuckets(revenue);
      setKpiRow(kpiList[0] ?? null);
      setLoyalUsers(loyal);
    } catch (err) {
      setReportError(err instanceof Error ? err : new Error("Failed to load reports"));
    } finally {
      setReportLoading(false);
    }
  }, [range.from, range.to]);

  useEffect(() => {
    void loadReports();
  }, [loadReports]);

  const bookingsPreview = useMemo(
    () => bookings.slice(0, PREVIEW_BOOKINGS),
    [bookings],
  );
  const isPageLoading = bookingsLoading || workoutsLoading;

  if (isPageLoading && bookings.length === 0 && workouts.length === 0) {
    return <DashboardStateMessage variant="loading" />;
  }

  const listError = bookingsError ?? workoutsError;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">Trainer dashboard</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Your trainees, sessions, and performance (last {REPORT_RANGE_DAYS} days for charts).
          </p>
        </div>
        <TikTokQuickAccessCard className="w-full max-w-[320px] sm:shrink-0 sm:self-start sm:justify-self-end" />
      </div>

      {listError ? (
        <DashboardStateMessage variant="error" message={listError.message} />
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardStatCard
          label="Open bookings (loaded)"
          value={bookings.length}
          hint="Latest page from your schedule."
          icon={<GroupIcon className="size-6 text-gray-700 dark:text-white/80" />}
        />
        <DashboardStatCard
          label="Workouts (loaded)"
          value={workouts.length}
          icon={<TaskIcon className="size-6 text-gray-700 dark:text-white/80" />}
        />
        <DashboardStatCard
          label="Confirmed bookings (period)"
          value={kpiRow?.confirmedBookingsCount ?? "—"}
          icon={<CalenderIcon className="size-6 text-gray-700 dark:text-white/80" />}
        />
        <DashboardStatCard
          label="Your share net (USD, period)"
          value={kpiRow != null ? formatCents(kpiRow.trainerShareNetCents) : "—"}
          icon={<DollarLineIcon className="size-6 text-gray-700 dark:text-white/80" />}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Link href={APP_ROUTES.SCHEDULE}>
          <Button type="button" variant="outline" size="sm">
            Schedule
          </Button>
        </Link>
        <Link href={APP_ROUTES.BOOKINGS}>
          <Button type="button" variant="outline" size="sm">
            Bookings
          </Button>
        </Link>
        <Link href={APP_ROUTES.WORKOUTS}>
          <Button type="button" variant="outline" size="sm">
            Workouts
          </Button>
        </Link>
        <Link href={APP_ROUTES.PAYOUTS}>
          <Button type="button" variant="outline" size="sm">
            Payouts
          </Button>
        </Link>
      </div>

      {reportLoading ? (
        <DashboardStateMessage variant="loading" message="Loading reports…" />
      ) : null}
      {reportError ? (
        <div className="flex items-center gap-2">
          <DashboardStateMessage variant="error" message={reportError.message} />
          <Button type="button" variant="outline" size="sm" onClick={() => void loadReports()}>
            Retry reports
          </Button>
        </div>
      ) : null}

      {!reportLoading && !reportError ? (
        <>
          <DashboardSection
            title="Your revenue (monthly)"
            description="From trainer reporting API — USD, net of refunds."
          >
            <RevenueBucketsTable rows={revenueBuckets} />
          </DashboardSection>
          <DashboardSection
            title="Your loyal trainees"
            description="Bookings created in the window, attributed to you."
          >
            <LoyalUsersTable rows={loyalUsers} rankLabel="Rank" />
          </DashboardSection>
        </>
      ) : null}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <DashboardSection
          title="Your bookings"
          action={
            <Link href={APP_ROUTES.BOOKINGS}>
              <Button type="button" variant="outline" size="sm">
                View all
              </Button>
            </Link>
          }
        >
          <BookingsTable bookings={bookingsPreview} perspective="trainer" />
        </DashboardSection>
        <DashboardSection
          title="Your workouts"
          action={
            <Link href={APP_ROUTES.WORKOUTS}>
              <Button type="button" variant="outline" size="sm">
                View all
              </Button>
            </Link>
          }
        >
          <WorkoutsTable workouts={workouts} perspective="trainer" />
        </DashboardSection>
      </div>

      {user?.email ? (
        <p className="text-xs text-gray-400 dark:text-gray-500">Signed in as {user.email}</p>
      ) : null}
    </div>
  );
};
