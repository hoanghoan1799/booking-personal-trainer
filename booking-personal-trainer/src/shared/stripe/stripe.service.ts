import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { createHash } from 'crypto';
import { ERROR_MESSAGES } from '../../common/constants/message.constant';

import type { StripeWebhookConstructedEvent } from './stripe-webhook-constructed-event.type';

type StripeIdempotencyKeyInput = {
  readonly operation: string;
  readonly targetType?: string;
  readonly targetId?: string;
  readonly billingChargeId?: string;
  readonly payerUserId?: string;
};

@Injectable()
export class StripeService {
  private readonly client: InstanceType<typeof Stripe>;

  constructor(private readonly configService: ConfigService) {
    const stripeSecretKey: string =
      this.configService.getOrThrow<string>('STRIPE_SECRET_KEY');
    this.client = new Stripe(stripeSecretKey);
  }

  /**
   * Returns the configured Stripe client.
   */
  getClient(): InstanceType<typeof Stripe> {
    return this.client;
  }

  /**
   * Validates the Stripe webhook signature and returns the parsed event.
   */
  constructWebhookEvent(
    rawBody: Buffer,
    stripeSignatureHeader: string,
  ): StripeWebhookConstructedEvent {
    const webhookSecret: string = this.configService.getOrThrow<string>(
      'STRIPE_WEBHOOK_SECRET',
    );
    try {
      return this.client.webhooks.constructEvent(
        rawBody,
        stripeSignatureHeader,
        webhookSecret,
      );
    } catch (err: unknown) {
      if (err instanceof Stripe.errors.StripeSignatureVerificationError) {
        throw new BadRequestException(
          ERROR_MESSAGES.STRIPE.INVALID_STRIPE_SIGNATURE,
        );
      }
      throw err;
    }
  }

  /**
   * Generates a stable idempotency key (max 255 chars) for Stripe requests.
   */
  createIdempotencyKey(input: StripeIdempotencyKeyInput): string {
    const serialized: string = JSON.stringify({
      operation: input.operation,
      targetType: input.targetType,
      targetId: input.targetId,
      billingChargeId: input.billingChargeId,
      payerUserId: input.payerUserId,
    });
    const digest: string = createHash('sha256')
      .update(serialized)
      .digest('hex');
    return `bpt_${input.operation}_${digest}`;
  }
}
