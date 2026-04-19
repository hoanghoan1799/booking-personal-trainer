import { Injectable } from '@nestjs/common';
import { EntityManager, FilterQuery } from '@mikro-orm/core';

import { PaymentStatus } from '../../../common/enums/billing/billing.enum';

import { PaymentSplitAggregationHelper } from '../../payments/helpers/payment-split-aggregation.helper';
import { Payment } from '../../payments/entities/payment.entity';
import { RevenueReportQueryDto } from '../dtos/revenue-report-query.dto';
import { RevenueBucketRowDto } from '../dtos/revenue-bucket-row.dto';
import { ReportBucket } from '../enums/report-bucket.enum';
import { ReportPeriodBucketHelper } from '../helpers/report-period-bucket.helper';

type MutableBucketTotals = {
  gmvNetCents: number;
  platformFeeNetCents: number;
  trainerShareNetCents: number;
  isEstimated: boolean;
};

@Injectable()
export class RevenueReportService {
  constructor(private readonly em: EntityManager) {}

  /**
   * Aggregates paid/refunded payments into calendar buckets (UTC).
   */
  public async getRevenueBuckets(input: {
    readonly query: RevenueReportQueryDto;
    readonly trainerUserIdFilter: string | null;
  }): Promise<RevenueBucketRowDto[]> {
    const bucket: ReportBucket = input.query.bucket ?? ReportBucket.MONTH;
    const normalizedCurrency: string | null =
      input.query.currency != null && input.query.currency.trim() !== ''
        ? input.query.currency.trim().toUpperCase()
        : null;
    const where: FilterQuery<Payment> =
      PaymentSplitAggregationHelper.buildPaidRefundedDateFilter({
        from: input.query.from,
        to: input.query.to,
        currency: normalizedCurrency,
      });
    const payments: Payment[] = await this.em.find(Payment, where, {
      orderBy: { createdAt: 'DESC' },
    });
    const bucketMap = new Map<string, MutableBucketTotals>();
    for (const payment of payments) {
      if (
        input.trainerUserIdFilter != null &&
        PaymentSplitAggregationHelper.readTrainerUserId(payment.metadata) !==
          input.trainerUserIdFilter
      ) {
        continue;
      }
      const isPaid: boolean = payment.status === PaymentStatus.PAID;
      const isRefunded: boolean = payment.status === PaymentStatus.REFUNDED;
      if (!isPaid && !isRefunded) {
        continue;
      }
      const eventDate: Date | null = isPaid
        ? (payment.paidAt ?? null)
        : (payment.refundedAt ?? null);
      if (!eventDate) {
        continue;
      }
      const currency: string = (payment.currency ?? 'USD').toUpperCase();
      const bucketStart: Date = ReportPeriodBucketHelper.getBucketStartUtc(
        eventDate,
        bucket,
      );
      const bucketKey: string = `${currency}:${bucketStart.toISOString()}`;
      const existing: MutableBucketTotals | undefined =
        bucketMap.get(bucketKey);
      const totals: MutableBucketTotals = existing ?? {
        gmvNetCents: 0,
        platformFeeNetCents: 0,
        trainerShareNetCents: 0,
        isEstimated: false,
      };
      const grossCents: number = payment.amountCents;
      const { platformFeeCents, trainerShareCents, isEstimated } =
        PaymentSplitAggregationHelper.readOrEstimateSplit({ payment });
      if (isEstimated) {
        totals.isEstimated = true;
      }
      const sign: number = isPaid ? 1 : -1;
      totals.gmvNetCents += sign * grossCents;
      totals.platformFeeNetCents += sign * platformFeeCents;
      totals.trainerShareNetCents += sign * trainerShareCents;
      if (!existing) {
        bucketMap.set(bucketKey, totals);
      }
    }
    const rows: RevenueBucketRowDto[] = [];
    for (const [key, totals] of bucketMap) {
      const currency: string = key.split(':')[0] ?? 'USD';
      const bucketStartIso: string = key.slice(currency.length + 1);
      const bucketStart: Date = new Date(bucketStartIso);
      const bucketEnd: Date = ReportPeriodBucketHelper.getBucketEndExclusiveUtc(
        bucketStart,
        bucket,
      );
      rows.push({
        bucketStart: bucketStart.toISOString(),
        bucketEnd: bucketEnd.toISOString(),
        currency,
        gmvNetCents: totals.gmvNetCents,
        platformFeeNetCents: totals.platformFeeNetCents,
        trainerShareNetCents: totals.trainerShareNetCents,
        isEstimated: totals.isEstimated,
      });
    }
    rows.sort((a, b) => {
      const c = a.currency.localeCompare(b.currency);
      if (c !== 0) {
        return c;
      }
      return a.bucketStart.localeCompare(b.bucketStart);
    });
    return rows;
  }
}
