import { apiFetch } from "@/lib/api";
import { API_BASE } from "@/lib/route.constants";

export type WorkoutPaymentAccess = {
  readonly isPaid: boolean;
  readonly view: "LIMITED" | "FULL";
  readonly billingChargeId: string | null;
  readonly amountCents: number | null;
  readonly currency: string | null;
};

export type CreateWorkoutPaymentIntentResult = {
  readonly paymentId: string;
  readonly providerPaymentIntentId: string;
  readonly clientSecret: string;
  readonly amountCents: number;
  readonly currency: string;
};

export const getWorkoutPaymentAccess = async (
  workoutId: string,
): Promise<WorkoutPaymentAccess> => {
  const res = await apiFetch<{ data: WorkoutPaymentAccess }>(
    `${API_BASE}/workouts/${workoutId}/payments/access`,
  );
  return res.data;
};

export const createWorkoutPaymentIntent = async (
  workoutId: string,
): Promise<CreateWorkoutPaymentIntentResult> => {
  const res = await apiFetch<{ data: CreateWorkoutPaymentIntentResult }>(
    `${API_BASE}/workouts/${workoutId}/payments/intent`,
    { method: "POST" },
  );
  return res.data;
};
