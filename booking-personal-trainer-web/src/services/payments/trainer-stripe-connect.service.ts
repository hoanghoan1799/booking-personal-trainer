import { apiFetch } from "@/lib/api";
import { API_BASE } from "@/lib/route.constants";

type ApiResponse<T> = {
  data: T;
};

export type StripeConnectOnboardingLinkResponse = {
  url: string;
  stripeAccountId: string;
};

const TRAINER_STRIPE_CONNECT_ONBOARD_ENDPOINT =
  `${API_BASE}/trainers/me/stripe-connect/onboard` as const;

export const createTrainerStripeConnectOnboardingLink = async (): Promise<StripeConnectOnboardingLinkResponse> => {
  const res = await apiFetch<ApiResponse<StripeConnectOnboardingLinkResponse>>(
    TRAINER_STRIPE_CONNECT_ONBOARD_ENDPOINT,
    { method: "POST" },
  );
  return res.data;
};

