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

  it('readTrainerUserId returns string id from metadata', () => {
    const actual = PaymentSplitAggregationHelper.readTrainerUserId({
      trainerUserId: 'trainer-1',
    });
    expect(actual).toBe('trainer-1');
  });
});
