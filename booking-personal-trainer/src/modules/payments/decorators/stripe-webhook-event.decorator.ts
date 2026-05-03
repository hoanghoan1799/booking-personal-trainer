import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import type { StripeWebhookIncomingRequest } from '../types/stripe-webhook-http.types';

/**
 * Injects the verified Stripe webhook event set by StripeWebhookSignatureGuard.
 * Only use alongside that guard on the same handler.
 */
export const StripeWebhookEvent = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request: StripeWebhookIncomingRequest = ctx
      .switchToHttp()
      .getRequest<StripeWebhookIncomingRequest>();
    return request.stripeWebhookEvent!;
  },
);
