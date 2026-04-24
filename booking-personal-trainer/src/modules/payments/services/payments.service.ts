import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import Stripe from 'stripe';

// Commons
import { utcNowAsDate } from '../../../common/utils/date-time/utc-date-time.helper';
import { PaymentStatus } from '../../../common/enums/billing/billing.enum';
import { ERROR_MESSAGES } from '../../../common/constants/message.constant';
import {
  PLATFORM_WORKOUT_FEE_BPS_ENV,
  SETTLEMENT_MODEL_PLATFORM_COLLECT,
  STRIPE_PROVIDER,
} from '../constants/stripe-webhook.constants';

// Shared
import { StripeService } from '../../../shared/stripe/stripe.service';

// Entities
import { Workout } from '../../workout/entities/workout.entity';

// Services
import { BillingService } from '../../billing/services/billing.service';

// Repositories
import {
  PaymentRepositoryToken,
  type PaymentRepository,
} from '../repositories/payment.repository.interface';
import { PAYMENT_INTENT } from '../constants/payment.constants';

export type CreateWorkoutPaymentIntentResult = {
  readonly paymentId: string;
  readonly providerPaymentIntentId: string;
  readonly clientSecret: string;
  readonly amountCents: number;
  readonly currency: string;
};

@Injectable()
export class PaymentsService {
  constructor(
    @Inject(PaymentRepositoryToken)
    private readonly paymentRepo: PaymentRepository,
    private readonly stripeService: StripeService,
    private readonly billingService: BillingService,
    private readonly em: EntityManager,
  ) {}

  async createWorkoutPaymentIntent(input: {
    readonly workoutId: string;
    readonly traineeId: string;
  }): Promise<CreateWorkoutPaymentIntentResult> {
    const stripeClient: InstanceType<typeof Stripe> =
      this.stripeService.getClient();
    const workout: Workout | null = await this.em.findOne(
      Workout,
      { id: input.workoutId, isDeleted: false },
      { populate: ['trainer', 'trainee'] },
    );
    if (!workout) {
      throw new NotFoundException(ERROR_MESSAGES.WORKOUT.NOT_FOUND);
    }
    if (workout.trainee.id !== input.traineeId) {
      throw new BadRequestException(ERROR_MESSAGES.WORKOUT.CAN_NOT_PAY);
    }
    const trainerConnectAccountId: string | null =
      (workout.trainer as unknown as { stripeAccountId?: string | null })
        .stripeAccountId ?? null;
    const activeCharge = await this.billingService.getLatestActiveWorkoutCharge(
      workout.id,
    );
    if (!activeCharge) {
      throw new BadRequestException(
        ERROR_MESSAGES.WORKOUT.NO_ACTIVE_BILLING_CHARGE,
      );
    }
    const grossCents = activeCharge.amountCents;
    const { platformFeeCents, trainerShareCents } =
      this.computePlatformFeeSplit({
        grossCents,
      });
    const idempotencyKey: string = this.stripeService.createIdempotencyKey({
      operation: PAYMENT_INTENT.OPERATIONS.CREATE,
      targetType: PAYMENT_INTENT.TYPES.WORKOUT,
      targetId: workout.id,
      billingChargeId: activeCharge.id,
      payerUserId: input.traineeId,
    });
    const existingPaymentByKey =
      await this.paymentRepo.findByProviderAndIdempotencyKey({
        provider: STRIPE_PROVIDER,
        idempotencyKey,
      });
    if (existingPaymentByKey?.providerPaymentIntentId) {
      const latestIntent = await stripeClient.paymentIntents.retrieve(
        existingPaymentByKey.providerPaymentIntentId,
      );
      if (!latestIntent.client_secret) {
        throw new Error(ERROR_MESSAGES.STRIPE.MISSING_STRIPE_CONFIG);
      }
      return {
        paymentId: existingPaymentByKey.id,
        providerPaymentIntentId: latestIntent.id,
        clientSecret: latestIntent.client_secret,
        amountCents: existingPaymentByKey.amountCents,
        currency: existingPaymentByKey.currency,
      };
    }
    const precreatedPayment =
      existingPaymentByKey ??
      (await this.paymentRepo.create({
        targetType: PAYMENT_INTENT.TYPES.WORKOUT,
        targetId: workout.id,
        payerUserId: input.traineeId,
        billingChargeId: activeCharge.id,
        amountCents: grossCents,
        currency: activeCharge.currency,
        status: PaymentStatus.PROCESSING,
        provider: STRIPE_PROVIDER,
        providerPaymentIntentId: null,
        idempotencyKey,
        metadata: {
          stripeStatus: PAYMENT_INTENT.STATUS.CREATED,
          settlementModel: SETTLEMENT_MODEL_PLATFORM_COLLECT,
          grossAmountCents: grossCents,
          platformFeeCents,
          trainerShareCents,
          trainerUserId: workout.trainer.id,
          trainerConnectAccountId,
          currency: activeCharge.currency,
          workoutId: workout.id,
        },
      }));
    const existingIntent = await stripeClient.paymentIntents.create(
      {
        amount: grossCents,
        currency: activeCharge.currency.toLowerCase(),
        automatic_payment_methods: { enabled: true },
        metadata: {
          workoutId: workout.id,
          billingChargeId: activeCharge.id,
          payerUserId: input.traineeId,
          trainerUserId: workout.trainer.id,
          settlementModel: SETTLEMENT_MODEL_PLATFORM_COLLECT,
          paymentId: precreatedPayment.id,
        },
      },
      { idempotencyKey },
    );
    const existing = await this.paymentRepo.findByProviderPaymentIntentId(
      existingIntent.id,
    );
    if (existing) {
      if (
        precreatedPayment.id !== existing.id &&
        precreatedPayment.providerPaymentIntentId == null
      ) {
        precreatedPayment.providerPaymentIntentId = existingIntent.id;
        precreatedPayment.status = existing.status;
        await this.paymentRepo.save(precreatedPayment);
      }
      const latestIntent = await stripeClient.paymentIntents.retrieve(
        existing.providerPaymentIntentId ?? existingIntent.id,
      );
      const latestStatus = latestIntent.status;
      if (latestStatus === PAYMENT_INTENT.STATUS.SUCCEEDED) {
        existing.status = PaymentStatus.PAID;
        existing.paidAt = existing.paidAt ?? utcNowAsDate();
        existing.failureReason = null;
        existing.metadata = {
          ...(existing.metadata ?? {}),
          stripeStatus: latestStatus,
        };
        await this.paymentRepo.save(existing);
        throw new BadRequestException(ERROR_MESSAGES.WORKOUT.ALREADY_PAID);
      }
      if (latestStatus === PAYMENT_INTENT.STATUS.CANCELED) {
        // Allow retry by creating a fresh intent with a different idempotency key.
        return this.createRetryWorkoutPaymentIntent({
          stripeClient,
          workout,
          traineeId: input.traineeId,
          activeChargeId: activeCharge.id,
          grossCents,
          currency: activeCharge.currency,
          platformFeeCents,
          trainerShareCents,
          trainerConnectAccountId,
        });
      }
      existing.status =
        this.mapStripePaymentIntentToPaymentStatus(latestStatus);
      existing.metadata = {
        ...(existing.metadata ?? {}),
        stripeStatus: latestStatus,
        settlementModel: SETTLEMENT_MODEL_PLATFORM_COLLECT,
        grossAmountCents: grossCents,
        platformFeeCents,
        trainerShareCents,
        trainerUserId: workout.trainer.id,
        trainerConnectAccountId,
        currency: activeCharge.currency,
        workoutId: workout.id,
      };
      await this.paymentRepo.save(existing);
      if (!latestIntent.client_secret) {
        throw new Error(ERROR_MESSAGES.STRIPE.MISSING_STRIPE_CONFIG);
      }
      return {
        paymentId: existing.id,
        providerPaymentIntentId: latestIntent.id,
        clientSecret: latestIntent.client_secret,
        amountCents: existing.amountCents,
        currency: existing.currency,
      };
    }
    const paymentIntent = existingIntent;
    if (paymentIntent.status === PAYMENT_INTENT.STATUS.SUCCEEDED) {
      throw new BadRequestException(ERROR_MESSAGES.WORKOUT.ALREADY_PAID);
    }
    if (paymentIntent.status === PAYMENT_INTENT.STATUS.CANCELED) {
      return this.createRetryWorkoutPaymentIntent({
        stripeClient,
        workout,
        traineeId: input.traineeId,
        activeChargeId: activeCharge.id,
        grossCents,
        currency: activeCharge.currency,
        platformFeeCents,
        trainerShareCents,
        trainerConnectAccountId,
      });
    }
    precreatedPayment.status = this.mapStripePaymentIntentToPaymentStatus(
      paymentIntent.status,
    );
    precreatedPayment.providerPaymentIntentId = paymentIntent.id;
    precreatedPayment.metadata = {
      ...(precreatedPayment.metadata ?? {}),
      stripeStatus: paymentIntent.status,
    };
    await this.paymentRepo.save(precreatedPayment);
    if (!paymentIntent.client_secret) {
      throw new Error(ERROR_MESSAGES.STRIPE.MISSING_STRIPE_CONFIG);
    }
    return {
      paymentId: precreatedPayment.id,
      providerPaymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amountCents: precreatedPayment.amountCents,
      currency: precreatedPayment.currency,
    };
  }

  async cancelPaymentIntent(input: {
    readonly providerPaymentIntentId: string;
  }): Promise<void> {
    const stripeClient: InstanceType<typeof Stripe> =
      this.stripeService.getClient();
    await stripeClient.paymentIntents.cancel(input.providerPaymentIntentId);
  }

  mapStripePaymentIntentToPaymentStatus(status: string): PaymentStatus {
    switch (status) {
      case PAYMENT_INTENT.STATUS.REQUIRES_PAYMENT_METHOD:
        return PaymentStatus.REQUIRES_PAYMENT_METHOD;
      case PAYMENT_INTENT.STATUS.REQUIRES_CONFIRMATION:
        return PaymentStatus.REQUIRES_CONFIRMATION;
      case PAYMENT_INTENT.STATUS.REQUIRES_ACTION:
        return PaymentStatus.REQUIRES_ACTION;
      case PAYMENT_INTENT.STATUS.PROCESSING:
        return PaymentStatus.PROCESSING;
      case PAYMENT_INTENT.STATUS.SUCCEEDED:
        return PaymentStatus.PAID;
      case PAYMENT_INTENT.STATUS.CANCELED:
        return PaymentStatus.CANCELLED;
      default:
        return PaymentStatus.PROCESSING;
    }
  }

  private computePlatformFeeSplit(input: { readonly grossCents: number }): {
    readonly platformFeeCents: number;
    readonly trainerShareCents: number;
  } {
    const raw = process.env[PLATFORM_WORKOUT_FEE_BPS_ENV];
    const parsed = raw != null && raw !== '' ? Number(raw) : 0;
    const bps = Number.isFinite(parsed)
      ? Math.min(Math.max(Math.trunc(parsed), 0), 10_000)
      : 0;
    const platformFeeCents = Math.floor((input.grossCents * bps) / 10_000);
    const trainerShareCents = Math.max(0, input.grossCents - platformFeeCents);
    return { platformFeeCents, trainerShareCents };
  }

  private async createRetryWorkoutPaymentIntent(input: {
    readonly stripeClient: InstanceType<typeof Stripe>;
    readonly workout: Workout;
    readonly traineeId: string;
    readonly activeChargeId: string;
    readonly grossCents: number;
    readonly currency: string;
    readonly platformFeeCents: number;
    readonly trainerShareCents: number;
    readonly trainerConnectAccountId: string | null;
  }): Promise<CreateWorkoutPaymentIntentResult> {
    const retryKey = this.stripeService.createIdempotencyKey({
      operation: PAYMENT_INTENT.OPERATIONS.CREATE_RETRY,
      targetType: PAYMENT_INTENT.TYPES.WORKOUT,
      targetId: input.workout.id,
      billingChargeId: input.activeChargeId,
      payerUserId: input.traineeId,
    });
    const paymentIntent = await input.stripeClient.paymentIntents.create(
      {
        amount: input.grossCents,
        currency: input.currency.toLowerCase(),
        automatic_payment_methods: { enabled: true },
        metadata: {
          workoutId: input.workout.id,
          billingChargeId: input.activeChargeId,
          payerUserId: input.traineeId,
          trainerUserId: input.workout.trainer.id,
          settlementModel: SETTLEMENT_MODEL_PLATFORM_COLLECT,
          retry: 'true',
        },
      },
      { idempotencyKey: retryKey },
    );
    const payment = await this.paymentRepo.create({
      targetType: PAYMENT_INTENT.TYPES.WORKOUT,
      targetId: input.workout.id,
      payerUserId: input.traineeId,
      billingChargeId: input.activeChargeId,
      amountCents: input.grossCents,
      currency: input.currency,
      status: this.mapStripePaymentIntentToPaymentStatus(paymentIntent.status),
      provider: STRIPE_PROVIDER,
      providerPaymentIntentId: paymentIntent.id,
      metadata: {
        stripeStatus: paymentIntent.status,
        settlementModel: SETTLEMENT_MODEL_PLATFORM_COLLECT,
        grossAmountCents: input.grossCents,
        platformFeeCents: input.platformFeeCents,
        trainerShareCents: input.trainerShareCents,
        trainerUserId: input.workout.trainer.id,
        trainerConnectAccountId: input.trainerConnectAccountId,
        currency: input.currency,
        workoutId: input.workout.id,
        retry: true,
      },
    });
    if (!paymentIntent.client_secret) {
      throw new Error(ERROR_MESSAGES.STRIPE.MISSING_STRIPE_CONFIG);
    }
    return {
      paymentId: payment.id,
      providerPaymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amountCents: payment.amountCents,
      currency: payment.currency,
    };
  }
}
