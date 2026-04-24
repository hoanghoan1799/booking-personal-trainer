export const StripeWebhookConstants = {
  Provider: 'stripe',
  EventTypes: {
    PaymentIntentSucceeded: 'payment_intent.succeeded',
    PaymentIntentFailed: 'payment_intent.payment_failed',
    PaymentIntentCanceled: 'payment_intent.canceled',
    ChargeRefunded: 'charge.refunded',
  },
} as const;

export const STRIPE_PROVIDER = 'stripe' as const;

export const SETTLEMENT_MODEL_PLATFORM_COLLECT = 'PLATFORM_COLLECT' as const;

export const PLATFORM_WORKOUT_FEE_BPS_ENV = 'PLATFORM_WORKOUT_FEE_BPS' as const;
