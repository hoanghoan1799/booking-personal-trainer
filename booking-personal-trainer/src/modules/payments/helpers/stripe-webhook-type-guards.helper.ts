type StripePaymentIntentLike = {
  readonly id: string;
  readonly status: string;
  readonly last_payment_error?: { readonly message?: string | null } | null;
};

type StripeChargeRefundedLike = {
  readonly id: string;
  readonly payment_intent?: string | null;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

export const isStripePaymentIntentLike = (
  value: unknown,
): value is StripePaymentIntentLike => {
  if (!isRecord(value)) return false;
  return typeof value.id === 'string' && typeof value.status === 'string';
};

export const isStripeChargeRefundedLike = (
  value: unknown,
): value is StripeChargeRefundedLike => {
  if (!isRecord(value)) return false;
  return typeof value.id === 'string';
};
