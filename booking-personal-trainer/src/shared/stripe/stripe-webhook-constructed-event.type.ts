import Stripe from 'stripe';

type StripeHttpClient = InstanceType<typeof Stripe>;

/** Return type of `Stripe.webhooks.constructEvent`. */
export type StripeWebhookConstructedEvent = ReturnType<
  StripeHttpClient['webhooks']['constructEvent']
>;
