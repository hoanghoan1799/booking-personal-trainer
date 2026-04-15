import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { createHash } from 'crypto';

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
