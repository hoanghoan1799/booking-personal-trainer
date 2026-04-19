import { FilterQuery } from '@mikro-orm/core';

import { PaymentStatus } from '../../../common/enums/billing/billing.enum';

import { Payment } from '../entities/payment.entity';

const PLATFORM_WORKOUT_FEE_BPS_ENV = 'PLATFORM_WORKOUT_FEE_BPS' as const;
const MAX_BPS = 10_000;

/**
 * Shared helpers for aggregating paid/refunded payments and fee splits.
 */
export class PaymentSplitAggregationHelper {
  /**
   * Builds a MikroORM filter for payments that are PAID or REFUNDED,
   * optionally scoped by paidAt/refundedAt date range and currency.
   */
  public static buildPaidRefundedDateFilter(input: {
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

  /**
   * Reads trainer user id from payment metadata when present.
   */
  public static readTrainerUserId(metadata: unknown): string | null {
    if (!metadata || typeof metadata !== 'object') {
      return null;
    }
    const value = (metadata as Record<string, unknown>).trainerUserId;
    return typeof value === 'string' && value.trim() !== '' ? value : null;
  }

  /**
   * Reads platform/trainer split from metadata or estimates from env bps.
   */
  public static readOrEstimateSplit(input: {
    readonly payment: Pick<Payment, 'amountCents' | 'metadata'>;
  }): {
    readonly platformFeeCents: number;
    readonly trainerShareCents: number;
    readonly isEstimated: boolean;
  } {
    const metadata = input.payment.metadata ?? null;
    const platformFeeMeta = PaymentSplitAggregationHelper.readPositiveInt(
      metadata && typeof metadata === 'object'
        ? (metadata as Record<string, unknown>).platformFeeCents
        : null,
    );
    const trainerShareMeta = PaymentSplitAggregationHelper.readPositiveInt(
      metadata && typeof metadata === 'object'
        ? (metadata as Record<string, unknown>).trainerShareCents
        : null,
    );
    if (platformFeeMeta != null && trainerShareMeta != null) {
      return {
        platformFeeCents: platformFeeMeta,
        trainerShareCents: trainerShareMeta,
        isEstimated: false,
      };
    }
    const { platformFeeCents, trainerShareCents } =
      PaymentSplitAggregationHelper.computeSplitFromBps({
        grossCents: input.payment.amountCents,
      });
    return { platformFeeCents, trainerShareCents, isEstimated: true };
  }

  private static computeSplitFromBps(input: { readonly grossCents: number }): {
    readonly platformFeeCents: number;
    readonly trainerShareCents: number;
  } {
    const raw: string | undefined = process.env[PLATFORM_WORKOUT_FEE_BPS_ENV];
    const parsed: number = raw != null && raw !== '' ? Number(raw) : 0;
    const bps: number = Number.isFinite(parsed)
      ? Math.min(Math.max(Math.trunc(parsed), 0), MAX_BPS)
      : 0;
    const platformFeeCents: number = Math.floor(
      (input.grossCents * bps) / MAX_BPS,
    );
    const trainerShareCents: number = Math.max(
      0,
      input.grossCents - platformFeeCents,
    );
    return { platformFeeCents, trainerShareCents };
  }

  private static readPositiveInt(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value >= 0 ? value : null;
    }
    if (typeof value === 'string' && /^\d+$/.test(value)) {
      return Number.parseInt(value, 10);
    }
    return null;
  }
}
