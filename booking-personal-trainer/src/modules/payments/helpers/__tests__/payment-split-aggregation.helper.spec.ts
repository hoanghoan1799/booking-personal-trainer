import { PaymentStatus } from '../../../../common/enums/billing/billing.enum';

import { Payment } from '../../entities/payment.entity';
import { PaymentSplitAggregationHelper } from '../payment-split-aggregation.helper';

describe('PaymentSplitAggregationHelper', () => {
  it('buildPaidRefundedDateFilter uses paidAt for PAID and refundedAt for REFUNDED', () => {
    const from = new Date('2026-01-01T00:00:00.000Z');
    const to = new Date('2026-02-01T00:00:00.000Z');
    const where = PaymentSplitAggregationHelper.buildPaidRefundedDateFilter({
      from,
      to,
      currency: 'USD',
    });
    expect(where).toMatchObject({
      status: { $in: [PaymentStatus.PAID, PaymentStatus.REFUNDED] },
      currency: 'USD',
    });
    expect(where).toHaveProperty('$or');
  });

  it('buildPaidRefundedDateFilter returns base when no date range', () => {
    const where = PaymentSplitAggregationHelper.buildPaidRefundedDateFilter({
      from: undefined,
      to: undefined,
      currency: null,
    });
    expect(where).toEqual({
      status: { $in: [PaymentStatus.PAID, PaymentStatus.REFUNDED] },
    });
  });

  it('buildPaidRefundedDateFilter supports from-only range', () => {
    const from = new Date('2026-01-01T00:00:00.000Z');
    const where = PaymentSplitAggregationHelper.buildPaidRefundedDateFilter({
      from,
      to: undefined,
      currency: null,
    }) as unknown as { readonly $or?: unknown };
    expect(where.$or).toBeDefined();
  });

  it('buildPaidRefundedDateFilter supports to-only range', () => {
    const to = new Date('2026-02-01T00:00:00.000Z');
    const where = PaymentSplitAggregationHelper.buildPaidRefundedDateFilter({
      from: undefined,
      to,
      currency: 'USD',
    }) as unknown as { readonly currency?: string; readonly $or?: unknown };
    expect(where.currency).toBe('USD');
    expect(where.$or).toBeDefined();
  });

  it('readOrEstimateSplit uses metadata when both fee fields exist', () => {
    const payment = {
      amountCents: 10_000,
      metadata: { platformFeeCents: 1000, trainerShareCents: 9000 },
    } as Pick<Payment, 'amountCents' | 'metadata'>;
    const actual = PaymentSplitAggregationHelper.readOrEstimateSplit({
      payment,
    });
    expect(actual).toEqual({
      platformFeeCents: 1000,
      trainerShareCents: 9000,
      isEstimated: false,
    });
  });

  it('readOrEstimateSplit estimates when metadata is missing fee fields', () => {
    process.env.PLATFORM_WORKOUT_FEE_BPS = '1000';
    const payment = {
      amountCents: 10_000,
      metadata: { trainerUserId: 't1' },
    } as Pick<Payment, 'amountCents' | 'metadata'>;
    const actual = PaymentSplitAggregationHelper.readOrEstimateSplit({
      payment,
    });
    expect(actual.isEstimated).toBe(true);
    expect(actual.platformFeeCents).toBe(1000);
    expect(actual.trainerShareCents).toBe(9000);
  });

  it('readOrEstimateSplit treats negative metadata values as missing', () => {
    process.env.PLATFORM_WORKOUT_FEE_BPS = '0';
    const payment = {
      amountCents: 1000,
      metadata: { platformFeeCents: -1, trainerShareCents: 1000 },
    } as unknown as Pick<Payment, 'amountCents' | 'metadata'>;
    const actual = PaymentSplitAggregationHelper.readOrEstimateSplit({
      payment,
    });
    expect(actual.isEstimated).toBe(true);
  });

  it('readOrEstimateSplit accepts string numeric metadata fields', () => {
    const payment = {
      amountCents: 1000,
      metadata: { platformFeeCents: '100', trainerShareCents: '900' },
    } as unknown as Pick<Payment, 'amountCents' | 'metadata'>;
    const actual = PaymentSplitAggregationHelper.readOrEstimateSplit({
      payment,
    });
    expect(actual).toEqual({
      platformFeeCents: 100,
      trainerShareCents: 900,
      isEstimated: false,
    });
  });

  it('readTrainerUserId returns string id from metadata', () => {
    const actual = PaymentSplitAggregationHelper.readTrainerUserId({
      trainerUserId: 'trainer-1',
    });
    expect(actual).toBe('trainer-1');
  });

  it('readTrainerUserId returns null for non-object metadata', () => {
    expect(PaymentSplitAggregationHelper.readTrainerUserId(null)).toBeNull();
    expect(PaymentSplitAggregationHelper.readTrainerUserId('x')).toBeNull();
  });

  it('readTrainerUserId returns null for blank trainerUserId', () => {
    expect(
      PaymentSplitAggregationHelper.readTrainerUserId({ trainerUserId: '   ' }),
    ).toBeNull();
  });
});
