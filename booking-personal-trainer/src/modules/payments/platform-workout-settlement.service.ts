import { Inject, Injectable, Logger } from '@nestjs/common';
import type Stripe from 'stripe';

// Shared
import { StripeService } from '../../shared/stripe/stripe.service';

// Entities
import { Payment } from './entities/payment.entity';

// Repositories
import {
  PaymentRepositoryToken,
  type PaymentRepository,
} from './repositories/payment.repository.interface';

const SETTLEMENT_MODEL = 'PLATFORM_COLLECT' as const;

type TrainerPayoutMetadata = {
  readonly status:
    | 'TRANSFERRED'
    | 'AWAITING_TRAINER_CONNECT'
    | 'SKIPPED_ZERO_SHARE'
    | 'FAILED';
  readonly transferId?: string;
  readonly errorMessage?: string;
};

/**
 * After a workout payment is collected on the **platform** Stripe account, moves the trainer's
 * share to their Connect account via Transfers. Platform fee stays on the platform balance.
 *
 * If the trainer has not completed Connect onboarding, payout is deferred (metadata only).
 */
@Injectable()
export class PlatformWorkoutSettlementService {
  private readonly logger = new Logger(PlatformWorkoutSettlementService.name);

  constructor(
    private readonly stripeService: StripeService,
    @Inject(PaymentRepositoryToken)
    private readonly paymentRepo: PaymentRepository,
  ) {}

  async applyTrainerShareTransferForPaidPayment(
    payment: Payment,
  ): Promise<void> {
    const meta = { ...(payment.metadata ?? {}) } as Record<string, unknown>;
    if (meta.settlementModel !== SETTLEMENT_MODEL) {
      return;
    }
    const existingPayout = meta.trainerPayout as
      | TrainerPayoutMetadata
      | undefined;
    if (existingPayout?.status === 'TRANSFERRED' && existingPayout.transferId) {
      return;
    }
    const trainerShareCents = this.readPositiveInt(meta.trainerShareCents);
    if (trainerShareCents == null || trainerShareCents <= 0) {
      meta.trainerPayout = {
        status: 'SKIPPED_ZERO_SHARE',
      } satisfies TrainerPayoutMetadata;
      payment.metadata = meta;
      await this.paymentRepo.save(payment);
      return;
    }
    const destination =
      typeof meta.trainerConnectAccountId === 'string' &&
      meta.trainerConnectAccountId.length > 0
        ? meta.trainerConnectAccountId
        : null;
    if (!destination) {
      meta.trainerPayout = {
        status: 'AWAITING_TRAINER_CONNECT',
      } satisfies TrainerPayoutMetadata;
      payment.metadata = meta;
      await this.paymentRepo.save(payment);
      return;
    }
    const currency = (
      typeof meta.currency === 'string' ? meta.currency : payment.currency
    ).toLowerCase();
    const stripeClient: InstanceType<typeof Stripe> =
      this.stripeService.getClient();
    const idempotencyKey = `trainer_share_transfer:${payment.id}`;
    const workoutId = this.readMetadataString(meta.workoutId, payment.targetId);
    const trainerUserId = this.readMetadataString(meta.trainerUserId, '');
    try {
      const transfer = await stripeClient.transfers.create(
        {
          amount: trainerShareCents,
          currency,
          destination,
          metadata: {
            paymentId: payment.id,
            workoutId,
            trainerUserId,
          },
        },
        { idempotencyKey },
      );
      meta.trainerPayout = {
        status: 'TRANSFERRED',
        transferId: transfer.id,
      } satisfies TrainerPayoutMetadata;
      payment.metadata = meta;
      await this.paymentRepo.save(payment);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(
        `Trainer transfer failed for payment ${payment.id}: ${message}`,
      );
      meta.trainerPayout = {
        status: 'FAILED',
        errorMessage: message,
      } satisfies TrainerPayoutMetadata;
      payment.metadata = meta;
      await this.paymentRepo.save(payment);
    }
  }

  private readPositiveInt(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === 'string' && /^\d+$/.test(value)) {
      return Number.parseInt(value, 10);
    }
    return null;
  }

  private readMetadataString(value: unknown, fallback: unknown): string {
    const readPrimitive = (input: unknown): string | null => {
      if (typeof input === 'string') {
        return input;
      }
      if (typeof input === 'number' && Number.isFinite(input)) {
        return String(input);
      }
      if (typeof input === 'boolean') {
        return input ? 'true' : 'false';
      }
      if (typeof input === 'bigint') {
        return String(input);
      }
      return null;
    };
    return readPrimitive(value) ?? readPrimitive(fallback) ?? '';
  }
}
