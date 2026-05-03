import type { Request } from 'express';

import type { StripeWebhookConstructedEvent } from '../../../shared/stripe/stripe-webhook-constructed-event.type';

/**
 * Stripe `Event` returned by `webhooks.constructEvent` after signature verification.
 */
export type StripeWebhookVerifiedSdkEvent = StripeWebhookConstructedEvent;

export type StripeWebhookIncomingRequest = Request & {
  readonly rawBody?: Buffer;
  stripeWebhookEvent?: StripeWebhookVerifiedSdkEvent;
};
