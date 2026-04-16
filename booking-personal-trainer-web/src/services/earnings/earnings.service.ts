import { apiFetch } from "@/lib/api";
import { API_BASE } from "@/lib/route.constants";

type ApiResponse<T> = {
  data: T;
};

export type AdminEarningsTotals = {
  currency: string;
  grossPaidCents: number;
  grossRefundedCents: number;
  grossNetCents: number;
  platformFeePaidCents: number;
  platformFeeRefundedCents: number;
  platformFeeNetCents: number;
  trainerSharePaidCents: number;
  trainerShareRefundedCents: number;
  trainerShareNetCents: number;
  isEstimated: boolean;
};

export type AdminEarningsTraineeRow = {
  traineeId: string;
  traineeName: string;
  traineeEmail: string;
  currency: string;
  paidCount: number;
  grossPaidCents: number;
  grossRefundedCents: number;
  grossNetCents: number;
};

export type AdminEarningsTrainerRow = {
  trainerId: string;
  trainerName: string;
  trainerEmail: string;
  currency: string;
  trainerSharePaidCents: number;
  trainerShareRefundedCents: number;
  trainerShareNetCents: number;
  payout: { statusCounts: Record<string, number> };
};

export type AdminEarningsResponse = {
  totals: AdminEarningsTotals[];
  trainees: AdminEarningsTraineeRow[];
  trainers: AdminEarningsTrainerRow[];
};

export type GetAdminEarningsQuery = {
  from?: string;
  to?: string;
  currency?: string;
};

const PAYMENTS_EARNINGS_ENDPOINT = `${API_BASE}/payments/earnings` as const;

const buildQueryString = (params: GetAdminEarningsQuery): string => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      searchParams.set(key, String(value));
    }
  });
  const qs = searchParams.toString();
  return qs ? `?${qs}` : "";
};

export const getAdminEarnings = async (
  query: GetAdminEarningsQuery = {},
): Promise<AdminEarningsResponse> => {
  const qs = buildQueryString(query);
  const res = await apiFetch<ApiResponse<AdminEarningsResponse>>(
    `${PAYMENTS_EARNINGS_ENDPOINT}${qs}`,
  );
  return res.data;
};

