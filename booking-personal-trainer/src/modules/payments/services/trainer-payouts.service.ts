import { Injectable } from '@nestjs/common';
import { EntityManager, FilterQuery } from '@mikro-orm/core';

import { PaymentStatus } from '../../../common/enums/billing/billing.enum';

import { Payment } from '../entities/payment.entity';
import { TrainerPayoutsQueryDto } from '../dtos/trainer-payouts-query.dto';
import {
  TrainerPayoutsCurrencySummaryDto,
  TrainerPayoutsResponseDto,
  TrainerPayoutsTransferRowDto,
} from '../dtos/trainer-payouts-response.dto';
import { TrainerPayoutsConstants } from '../constants/trainer-payouts.constants';

@Injectable()
export class TrainerPayoutsService {
  constructor(private readonly em: EntityManager) {}

  async getMyPayouts(input: {
    readonly trainerId: string;
    readonly query: TrainerPayoutsQueryDto;
  }): Promise<TrainerPayoutsResponseDto> {
    const normalizedCurrency: string | null =
      input.query.currency != null && input.query.currency.trim() !== ''
        ? input.query.currency.trim().toUpperCase()
        : null;

    const where: FilterQuery<Payment> = this.buildWhere({
      from: input.query.from,
      to: input.query.to,
      currency: normalizedCurrency,
    });

    const payments: Payment[] = await this.em.find(Payment, where, {
      orderBy: { createdAt: 'DESC' },
    });

    const summaryByCurrency = new Map<
      string,
      TrainerPayoutsCurrencySummaryDto
    >();
    const rows: TrainerPayoutsTransferRowDto[] = [];

    for (const payment of payments) {
      const trainerUserId: string | null = this.readTrainerUserId(
        payment.metadata,
      );
      if (trainerUserId !== input.trainerId) {
        continue;
      }

      const currency: string = (
        payment.currency ?? TrainerPayoutsConstants.DefaultCurrency
      ).toUpperCase();
      const summary = this.getOrCreateCurrencySummary(
        summaryByCurrency,
        currency,
      );

      const isPaid = payment.status === PaymentStatus.PAID;
      const isRefunded = payment.status === PaymentStatus.REFUNDED;
      if (!isPaid && !isRefunded) {
        continue;
      }

      const { trainerShareCents, isEstimated } =
        this.readOrEstimateTrainerShare({
          payment,
        });
      if (isEstimated) {
        summary.isEstimated = true;
      }

      const payout = this.readTrainerPayout(payment.metadata);
      const payoutStatus: string = payout?.status ?? 'UNKNOWN';
      summary.payoutStatusCounts[payoutStatus] =
        (summary.payoutStatusCounts[payoutStatus] ?? 0) + 1;

      if (isPaid) {
        summary.paidTrainerShareCents += trainerShareCents;
      } else {
        summary.refundedTrainerShareCents += trainerShareCents;
      }
      summary.netTrainerShareCents =
        summary.paidTrainerShareCents - summary.refundedTrainerShareCents;

      if (rows.length < TrainerPayoutsConstants.MaxRows) {
        rows.push({
          paymentId: payment.id,
          currency,
          status: payoutStatus,
          trainerShareCents,
          transferId: payout?.transferId ?? null,
          errorMessage: payout?.errorMessage ?? null,
        });
      }
    }

    const summary: TrainerPayoutsCurrencySummaryDto[] = Array.from(
      summaryByCurrency.values(),
    ).sort((a, b) => a.currency.localeCompare(b.currency));

    return { summary, rows };
  }

  private buildWhere(input: {
    readonly from?: Date;
    readonly to?: Date;
    readonly currency: string | null;
  }): FilterQuery<Payment> {
    const base: FilterQuery<Payment> = {
      status: { $in: [PaymentStatus.PAID, PaymentStatus.REFUNDED] },
    };
    if (input.currency) {
      base.currency = input.currency;
    }
    const from: Date | undefined = input.from;
    const to: Date | undefined = input.to;
    if (!from && !to) {
      return base;
    }

    const paidAtRange: Record<string, Date> = {};
    const refundedAtRange: Record<string, Date> = {};
    if (from) {
      paidAtRange.$gte = from;
      refundedAtRange.$gte = from;
    }
    if (to) {
      paidAtRange.$lt = to;
      refundedAtRange.$lt = to;
    }

    return {
      ...base,
      $or: [
        { status: PaymentStatus.PAID, paidAt: paidAtRange },
        { status: PaymentStatus.REFUNDED, refundedAt: refundedAtRange },
      ],
    };
  }

  private getOrCreateCurrencySummary(
    map: Map<string, TrainerPayoutsCurrencySummaryDto>,
    currency: string,
  ): TrainerPayoutsCurrencySummaryDto {
    const existing = map.get(currency);
    if (existing) {
      return existing;
    }
    const created: TrainerPayoutsCurrencySummaryDto = {
      currency,
      paidTrainerShareCents: 0,
      refundedTrainerShareCents: 0,
      netTrainerShareCents: 0,
      payoutStatusCounts: {},
      isEstimated: false,
    };
    map.set(currency, created);
    return created;
  }

  private readTrainerUserId(metadata: unknown): string | null {
    if (!metadata || typeof metadata !== 'object') {
      return null;
    }
    const value = (metadata as Record<string, unknown>).trainerUserId;
    return typeof value === 'string' && value.trim() !== '' ? value : null;
  }

  private readTrainerPayout(
    metadata: unknown,
  ): { status: string; transferId?: string; errorMessage?: string } | null {
    if (!metadata || typeof metadata !== 'object') {
      return null;
    }
    const payout = (metadata as Record<string, unknown>).trainerPayout;
    if (!payout || typeof payout !== 'object') {
      return null;
    }
    const status = (payout as Record<string, unknown>).status;
    const transferId = (payout as Record<string, unknown>).transferId;
    const errorMessage = (payout as Record<string, unknown>).errorMessage;
    return {
      status:
        typeof status === 'string' && status.trim() !== '' ? status : 'UNKNOWN',
      transferId:
        typeof transferId === 'string' && transferId.trim() !== ''
          ? transferId
          : undefined,
      errorMessage:
        typeof errorMessage === 'string' && errorMessage.trim() !== ''
          ? errorMessage
          : undefined,
    };
  }

  private readOrEstimateTrainerShare(input: { readonly payment: Payment }): {
    readonly trainerShareCents: number;
    readonly isEstimated: boolean;
  } {
    const metadata = input.payment.metadata ?? null;
    const trainerShareMeta = this.readPositiveInt(
      metadata && typeof metadata === 'object'
        ? (metadata as Record<string, unknown>).trainerShareCents
        : null,
    );
    if (trainerShareMeta != null) {
      return { trainerShareCents: trainerShareMeta, isEstimated: false };
    }
    const split = this.computeSplitFromBps({
      grossCents: input.payment.amountCents,
    });
    return { trainerShareCents: split.trainerShareCents, isEstimated: true };
  }

  private computeSplitFromBps(input: { readonly grossCents: number }): {
    readonly platformFeeCents: number;
    readonly trainerShareCents: number;
  } {
    const raw: string | undefined =
      process.env[TrainerPayoutsConstants.PlatformWorkoutFeeBpsEnv];
    const parsed: number = raw != null && raw !== '' ? Number(raw) : 0;
    const bps: number = Number.isFinite(parsed)
      ? Math.min(
          Math.max(Math.trunc(parsed), 0),
          TrainerPayoutsConstants.MaxBps,
        )
      : 0;
    const platformFeeCents: number = Math.floor(
      (input.grossCents * bps) / TrainerPayoutsConstants.MaxBps,
    );
    const trainerShareCents: number = Math.max(
      0,
      input.grossCents - platformFeeCents,
    );
    return { platformFeeCents, trainerShareCents };
  }

  private readPositiveInt(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value >= 0 ? value : null;
    }
    if (typeof value === 'string' && /^\d+$/.test(value)) {
      return Number.parseInt(value, 10);
    }
    return null;
  }
}
