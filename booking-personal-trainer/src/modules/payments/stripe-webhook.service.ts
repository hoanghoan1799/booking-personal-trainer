import { Inject, Injectable } from '@nestjs/common';

// Commons
import { PaymentStatus } from '../../common/enums/billing/billing.enum';

// Repositories
import type { PaymentRepository } from './repositories/payment.repository.interface';
import { PaymentRepositoryToken } from './repositories/payment.repository.interface';
import { PlatformWorkoutSettlementService } from './platform-workout-settlement.service';

const STRIPE_PAYMENT_INTENT_SUCCEEDED = 'payment_intent.succeeded' as const;
const STRIPE_PAYMENT_INTENT_FAILED = 'payment_intent.payment_failed' as const;
const STRIPE_PAYMENT_INTENT_CANCELED = 'payment_intent.canceled' as const;
const STRIPE_CHARGE_REFUNDED = 'charge.refunded' as const;

@Injectable()
export class StripeWebhookService {
  constructor(
    @Inject(PaymentRepositoryToken)
    private readonly paymentRepo: PaymentRepository,
    private readonly platformWorkoutSettlementService: PlatformWorkoutSettlementService,
  ) {}

  async handleEvent(event: {
    type: string;
    data: { object: unknown };
  }): Promise<void> {
    switch (event.type) {
      case STRIPE_PAYMENT_INTENT_SUCCEEDED:
        await this.handlePaymentIntentSucceeded(event.data.object as any);
        return;
      case STRIPE_PAYMENT_INTENT_FAILED:
        await this.handlePaymentIntentFailed(event.data.object as any);
        return;
      case STRIPE_PAYMENT_INTENT_CANCELED:
        await this.handlePaymentIntentCanceled(event.data.object as any);
        return;
      case STRIPE_CHARGE_REFUNDED:
        await this.handleChargeRefunded(event.data.object as any);
        return;
      default:
        return;
    }
  }

  private async handlePaymentIntentSucceeded(paymentIntent: {
    id: string;
    status: string;
  }): Promise<void> {
    const payment = await this.paymentRepo.findByProviderPaymentIntentId(
      paymentIntent.id,
    );
    if (!payment) return;
    if (payment.status === PaymentStatus.PAID) return;
    payment.status = PaymentStatus.PAID;
    payment.paidAt = new Date();
    payment.failureReason = null;
    payment.metadata = {
      ...(payment.metadata ?? {}),
      stripeStatus: paymentIntent.status,
    };
    await this.paymentRepo.save(payment);
    await this.platformWorkoutSettlementService.applyTrainerShareTransferForPaidPayment(
      payment,
    );
  }

  private async handlePaymentIntentFailed(paymentIntent: {
    id: string;
    status: string;
    last_payment_error?: { message?: string | null } | null;
  }): Promise<void> {
    const payment = await this.paymentRepo.findByProviderPaymentIntentId(
      paymentIntent.id,
    );
    if (!payment) return;
    if (payment.status === PaymentStatus.PAID) return;
    payment.status = PaymentStatus.FAILED;
    payment.failureReason =
      paymentIntent.last_payment_error?.message ?? 'Payment failed';
    payment.metadata = {
      ...(payment.metadata ?? {}),
      stripeStatus: paymentIntent.status,
    };
    await this.paymentRepo.save(payment);
  }

  private async handlePaymentIntentCanceled(paymentIntent: {
    id: string;
    status: string;
  }): Promise<void> {
    const payment = await this.paymentRepo.findByProviderPaymentIntentId(
      paymentIntent.id,
    );
    if (!payment) return;
    if (payment.status === PaymentStatus.PAID) return;
    payment.status = PaymentStatus.CANCELLED;
    payment.metadata = {
      ...(payment.metadata ?? {}),
      stripeStatus: paymentIntent.status,
    };
    await this.paymentRepo.save(payment);
  }

  private async handleChargeRefunded(charge: {
    id: string;
    payment_intent?: string | null;
  }): Promise<void> {
    const paymentIntentId: string | null =
      typeof charge.payment_intent === 'string' ? charge.payment_intent : null;
    if (!paymentIntentId) return;
    const payment =
      await this.paymentRepo.findByProviderPaymentIntentId(paymentIntentId);
    if (!payment) return;
    payment.status = PaymentStatus.REFUNDED;
    payment.refundedAt = new Date();
    payment.metadata = {
      ...(payment.metadata ?? {}),
      stripeChargeId: charge.id,
      stripeRefunded: true,
    };
    await this.paymentRepo.save(payment);
  }
}
