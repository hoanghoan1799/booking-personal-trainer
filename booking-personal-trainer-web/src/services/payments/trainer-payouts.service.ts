import { apiFetch } from "@/lib/api";
import { API_BASE } from "@/lib/route.constants";

type ApiResponse<T> = {
  data: T;
};

export type TrainerPayoutsCurrencySummary = {
  currency: string;
  paidTrainerShareCents: number;
  refundedTrainerShareCents: number;
  netTrainerShareCents: number;
  payoutStatusCounts: Record<string, number>;
  isEstimated: boolean;
};

export type TrainerPayoutsRow = {
  paymentId: string;
  currency: string;
  status: string;
  trainerShareCents: number;
  transferId: string | null;
  errorMessage: string | null;
};

export type TrainerPayoutsResponse = {
  summary: TrainerPayoutsCurrencySummary[];
  rows: TrainerPayoutsRow[];
};

export type GetTrainerPayoutsQuery = {
  from?: string;
  to?: string;
  currency?: string;
};

const TRAINER_PAYOUTS_ENDPOINT = `${API_BASE}/trainers/me/payouts` as const;

const buildQueryString = (params: GetTrainerPayoutsQuery): string => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      searchParams.set(key, String(value));
    }
  });
  const qs = searchParams.toString();
  return qs ? `?${qs}` : "";
};

export const getMyTrainerPayouts = async (
  query: GetTrainerPayoutsQuery = {},
): Promise<TrainerPayoutsResponse> => {
  const qs = buildQueryString(query);
  const res = await apiFetch<ApiResponse<TrainerPayoutsResponse>>(
    `${TRAINER_PAYOUTS_ENDPOINT}${qs}`,
  );
  return res.data;
};

