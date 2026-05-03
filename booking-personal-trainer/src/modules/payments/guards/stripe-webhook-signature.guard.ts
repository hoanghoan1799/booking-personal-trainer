import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';

import type { IncomingHttpHeaders } from 'node:http';

import type { StripeWebhookIncomingRequest } from '../types/stripe-webhook-http.types';

// Stripe
import type { StripeWebhookConstructedEvent } from '../../../shared/stripe/stripe-webhook-constructed-event.type';
import { StripeService } from '../../../shared/stripe/stripe.service';
import { ERROR_MESSAGES } from '../../../common/constants/message.constant';

const readStripeSignatureHeader = (headers: IncomingHttpHeaders): string => {
  const maybe: string | string[] | undefined = headers['stripe-signature'];
  if (typeof maybe === 'string') {
    return maybe;
  }
  if (Array.isArray(maybe)) {
    const first: unknown = maybe[0];
    return typeof first === 'string' ? first : '';
  }
  return '';
};

@Injectable()
export class StripeWebhookSignatureGuard implements CanActivate {
  constructor(private readonly stripeService: StripeService) {}

  canActivate(context: ExecutionContext): boolean {
    const req: StripeWebhookIncomingRequest = context
      .switchToHttp()
      .getRequest<StripeWebhookIncomingRequest>();
    const rawBody: Buffer | undefined = req.rawBody;
    if (!Buffer.isBuffer(rawBody) || rawBody.length === 0) {
      throw new BadRequestException(ERROR_MESSAGES.STRIPE.MISSING_RAW_BODY);
    }
    const stripeSignatureHeader: string = readStripeSignatureHeader(
      req.headers,
    );
    if (!stripeSignatureHeader) {
      throw new BadRequestException(
        ERROR_MESSAGES.STRIPE.MISSING_SIGNATURE_HEADER,
      );
    }
    const verifiedEvent: StripeWebhookConstructedEvent =
      this.stripeService.constructWebhookEvent(rawBody, stripeSignatureHeader);
    req.stripeWebhookEvent = verifiedEvent;
    return true;
  }
}
