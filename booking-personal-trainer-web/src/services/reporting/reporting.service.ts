import { apiFetch } from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/route.constants";

type ApiResponse<T> = {
  data: T;
};

export type ReportBucket = "MONTH" | "QUARTER";

export type RevenueBucketRow = {
  bucketStart: string;
  bucketEnd: string;
  currency: string;
  gmvNetCents: number;
  platformFeeNetCents: number;
  trainerShareNetCents: number;
  isEstimated: boolean;
};

export type TrainerKpiRow = {
  trainerId: string;
  trainerName: string;
  trainerEmail: string;
  confirmedBookingsCount: number;
  cancelledBookingsCount: number;
  rejectedBookingsCount: number;
  workoutsDoneCount: number;
  deliveredMinutes: number;
  trainerShareNetCents: number;
};

export type LoyalUserRow = {
  userId: string;
  userName: string;
  userEmail: string;
  bookingsCount: number;
  confirmedBookingsCount: number;
};

export type RevenueReportQuery = {
  from?: string;
  to?: string;
  currency?: string;
  bucket?: ReportBucket;
};

export type TrainerKpiQuery = {
  from?: string;
  to?: string;
  limit?: number;
  currency?: string;
};

export type LoyalUsersQuery = {
  from?: string;
  to?: string;
  limit?: number;
};

const buildQueryString = (params: Record<string, string | number | undefined>): string => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      searchParams.set(key, String(value));
    }
  });
  const qs = searchParams.toString();
  return qs ? `?${qs}` : "";
};

export const getAdminRevenueReport = async (
  query: RevenueReportQuery = {},
): Promise<RevenueBucketRow[]> => {
  const qs = buildQueryString({
    from: query.from,
    to: query.to,
    currency: query.currency,
    bucket: query.bucket,
  });
  const res = await apiFetch<ApiResponse<RevenueBucketRow[]>>(
    `${API_ENDPOINTS.ADMIN_REPORTS}/revenue${qs}`,
  );
  return res.data;
};

export const getAdminTrainerKpi = async (
  query: TrainerKpiQuery = {},
): Promise<TrainerKpiRow[]> => {
  const qs = buildQueryString({
    from: query.from,
    to: query.to,
    limit: query.limit,
    currency: query.currency,
  });
  const res = await apiFetch<ApiResponse<TrainerKpiRow[]>>(
    `${API_ENDPOINTS.ADMIN_REPORTS}/trainer-kpi${qs}`,
  );
  return res.data;
};

export const getAdminLoyalUsers = async (
  query: LoyalUsersQuery = {},
): Promise<LoyalUserRow[]> => {
  const qs = buildQueryString({
    from: query.from,
    to: query.to,
    limit: query.limit,
  });
  const res = await apiFetch<ApiResponse<LoyalUserRow[]>>(
    `${API_ENDPOINTS.ADMIN_REPORTS}/loyal-users${qs}`,
  );
  return res.data;
};

export const getTrainerRevenueReport = async (
  query: RevenueReportQuery = {},
): Promise<RevenueBucketRow[]> => {
  const qs = buildQueryString({
    from: query.from,
    to: query.to,
    currency: query.currency,
    bucket: query.bucket,
  });
  const res = await apiFetch<ApiResponse<RevenueBucketRow[]>>(
    `${API_ENDPOINTS.TRAINER_REPORTS}/revenue${qs}`,
  );
  return res.data;
};

export const getTrainerKpiReport = async (
  query: TrainerKpiQuery = {},
): Promise<TrainerKpiRow[]> => {
  const qs = buildQueryString({
    from: query.from,
    to: query.to,
    limit: query.limit,
    currency: query.currency,
  });
  const res = await apiFetch<ApiResponse<TrainerKpiRow[]>>(
    `${API_ENDPOINTS.TRAINER_REPORTS}/kpi${qs}`,
  );
  return res.data;
};

export const getTrainerLoyalUsers = async (
  query: LoyalUsersQuery = {},
): Promise<LoyalUserRow[]> => {
  const qs = buildQueryString({
    from: query.from,
    to: query.to,
    limit: query.limit,
  });
  const res = await apiFetch<ApiResponse<LoyalUserRow[]>>(
    `${API_ENDPOINTS.TRAINER_REPORTS}/loyal-users${qs}`,
  );
  return res.data;
};
