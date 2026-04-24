"use client";

import type React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { DollarLineIcon, GroupIcon, TaskIcon, UserIcon } from "@/icons";
import { APP_ROUTES } from "@/lib/route.constants";
import { getUtcRangeIso } from "@/lib/report-date-range";
import { formatCents } from "@/lib/format-money";
import { getBookings } from "@/services/bookings/bookings.service";
import type { Booking } from "@/services/bookings/bookings.service";
import { getWorkouts } from "@/services/workouts/workouts.service";
import type { Workout } from "@/services/workouts/workouts.service";
import { getUsers } from "@/services/users/users.service";
import { getAdminEarnings } from "@/services/earnings/earnings.service";
import {
  getAdminLoyalUsers,
  getAdminRevenueReport,
  getAdminTrainerKpi,
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
import { TrainerKpiTable } from "./trainer-kpi-table";
import { LoyalUsersTable } from "./loyal-users-table";

const REPORT_RANGE_DAYS = 90;
const PREVIEW_LIMIT = 12;
const TOP_KPI_LIMIT = 15;
const TOP_LOYAL = 10;

export const AdminDashboard = (): React.ReactNode => {
  const range = useMemo(() => getUtcRangeIso(REPORT_RANGE_DAYS), []);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [trainerCount, setTrainerCount] = useState<number>(0);
  const [traineeCount, setTraineeCount] = useState<number>(0);
  const [bookingTotal, setBookingTotal] = useState<number>(0);
  const [workoutTotal, setWorkoutTotal] = useState<number>(0);
  const [financeUsdGrossNet, setFinanceUsdGrossNet] = useState<number | null>(null);
  const [bookingsPreview, setBookingsPreview] = useState<Booking[]>([]);
  const [workoutsPreview, setWorkoutsPreview] = useState<Workout[]>([]);
  const [revenueBuckets, setRevenueBuckets] = useState<RevenueBucketRow[]>([]);
  const [trainerKpi, setTrainerKpi] = useState<TrainerKpiRow[]>([]);
  const [loyalUsers, setLoyalUsers] = useState<LoyalUserRow[]>([]);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [
        allUsers,
        trainersMeta,
        traineesMeta,
        bookingsRes,
        workoutsRes,
        earnings,
        revenue,
        kpi,
        loyal,
      ] = await Promise.all([
        getUsers({ page: 1, limit: 1 }),
        getUsers({ role: "TRAINER", page: 1, limit: 1 }),
        getUsers({ role: "TRAINEE", page: 1, limit: 1 }),
        getBookings({ page: 1, limit: PREVIEW_LIMIT, order: "DESC" }),
        getWorkouts({ page: 1, limit: PREVIEW_LIMIT }),
        getAdminEarnings({ from: range.from, to: range.to, currency: "USD" }),
        getAdminRevenueReport({
          from: range.from,
          to: range.to,
          currency: "USD",
          bucket: "MONTH",
        }),
        getAdminTrainerKpi({
          from: range.from,
          to: range.to,
          limit: TOP_KPI_LIMIT,
          currency: "USD",
        }),
        getAdminLoyalUsers({ from: range.from, to: range.to, limit: TOP_LOYAL }),
      ]);
      setTotalUsers(allUsers.meta.totalItems);
      setTrainerCount(trainersMeta.meta.totalItems);
      setTraineeCount(traineesMeta.meta.totalItems);
      setBookingTotal(bookingsRes.meta.totalItems);
      setWorkoutTotal(workoutsRes.meta.totalItems);
      const usdTotals = earnings.totals.find((t) => t.currency === "USD");
      setFinanceUsdGrossNet(usdTotals?.grossNetCents ?? null);
      setBookingsPreview(bookingsRes.bookings);
      setWorkoutsPreview(workoutsRes.workouts);
      setRevenueBuckets(revenue);
      setTrainerKpi(kpi);
      setLoyalUsers(loyal);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load dashboard"));
    } finally {
      setIsLoading(false);
    }
  }, [range.from, range.to]);

  useEffect(() => {
    void load();
  }, [load]);

  if (isLoading) {
    return <DashboardStateMessage variant="loading" />;
  }
  if (error) {
    return (
      <div className="space-y-4">
        <DashboardStateMessage variant="error" message={error.message} />
        <Button type="button" variant="outline" size="sm" onClick={() => void load()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">Admin dashboard</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            System overview and reporting (last {REPORT_RANGE_DAYS} days, USD where applicable).
          </p>
        </div>
        <TikTokQuickAccessCard className="w-full max-w-[320px] sm:shrink-0 sm:self-start sm:justify-self-end" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardStatCard
          label="Total users"
          value={totalUsers.toLocaleString()}
          icon={<GroupIcon className="size-6 text-gray-700 dark:text-white/80" />}
        />
        <DashboardStatCard
          label="Trainers / Trainees"
          value={`${trainerCount.toLocaleString()} / ${traineeCount.toLocaleString()}`}
          hint="Role counts from the users directory."
          icon={<UserIcon className="size-6 text-gray-700 dark:text-white/80" />}
        />
        <DashboardStatCard
          label="Bookings / Workouts (all time)"
          value={`${bookingTotal.toLocaleString()} / ${workoutTotal.toLocaleString()}`}
          icon={<TaskIcon className="size-6 text-gray-700 dark:text-white/80" />}
        />
        <DashboardStatCard
          label="GMV net (USD, period)"
          value={financeUsdGrossNet != null ? formatCents(financeUsdGrossNet) : "—"}
          hint="From payments/earnings for the same window."
          icon={<DollarLineIcon className="size-6 text-gray-700 dark:text-white/80" />}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Link href={APP_ROUTES.USERS}>
          <Button type="button" variant="outline" size="sm">
            Users
          </Button>
        </Link>
        <Link href={APP_ROUTES.FINANCE}>
          <Button type="button" variant="outline" size="sm">
            Finance
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
      </div>

      <DashboardSection
        title="Revenue by month (reporting API)"
        description="Monthly buckets: GMV, platform fee, and trainer share (net of refunds)."
      >
        <RevenueBucketsTable rows={revenueBuckets} />
      </DashboardSection>

      <DashboardSection
        title="Trainer KPI leaderboard"
        description="Top trainers by trainer share (USD) in the selected window."
      >
        <TrainerKpiTable rows={trainerKpi} />
      </DashboardSection>

      <DashboardSection
        title="Loyal users"
        description="Trainees ranked by bookings created in the window."
      >
        <LoyalUsersTable rows={loyalUsers} />
      </DashboardSection>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <DashboardSection
          title="Recent bookings"
          action={
            <Link href={APP_ROUTES.BOOKINGS}>
              <Button type="button" variant="outline" size="sm">
                View all
              </Button>
            </Link>
          }
        >
          <BookingsTable bookings={bookingsPreview} perspective="admin" />
        </DashboardSection>
        <DashboardSection
          title="Recent workouts"
          action={
            <Link href={APP_ROUTES.WORKOUTS}>
              <Button type="button" variant="outline" size="sm">
                View all
              </Button>
            </Link>
          }
        >
          <WorkoutsTable workouts={workoutsPreview} perspective="admin" />
        </DashboardSection>
      </div>
    </div>
  );
};
