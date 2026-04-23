export const StripeWebhookConstants = {
  Provider: 'stripe',
  EventTypes: {
    PaymentIntentSucceeded: 'payment_intent.succeeded',
    PaymentIntentFailed: 'payment_intent.payment_failed',
    PaymentIntentCanceled: 'payment_intent.canceled',
    ChargeRefunded: 'charge.refunded',
  },
} as const;
