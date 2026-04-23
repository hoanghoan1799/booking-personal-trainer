import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from '@mikro-orm/core';

import { PaymentStatus } from '../../../../common/enums/billing/billing.enum';

import { Payment } from '../../../payments/entities/payment.entity';
import { ReportBucket } from '../../enums/report-bucket.enum';
import { RevenueReportService } from '../revenue-report.service';

type FakePayment = Pick<
  Payment,
  | 'status'
  | 'amountCents'
  | 'currency'
  | 'paidAt'
  | 'refundedAt'
  | 'metadata'
  | 'createdAt'
>;

describe('RevenueReportService', () => {
  let service: RevenueReportService;
  let em: { find: jest.Mock };

  beforeEach(async () => {
    em = { find: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RevenueReportService,
        { provide: EntityManager, useValue: em },
      ],
    }).compile();
    service = module.get(RevenueReportService);
  });

  it('buckets PAID and REFUNDED into monthly nets', async () => {
    const payments: FakePayment[] = [
      {
        status: PaymentStatus.PAID,
        amountCents: 3000,
        currency: 'USD',
        paidAt: new Date('2026-01-15T00:00:00.000Z'),
        refundedAt: null,
        metadata: {
          trainerUserId: 't1',
          platformFeeCents: 300,
          trainerShareCents: 2700,
        },
        createdAt: new Date(),
      },
      {
        status: PaymentStatus.REFUNDED,
        amountCents: 1000,
        currency: 'USD',
        paidAt: null,
        refundedAt: new Date('2026-01-20T00:00:00.000Z'),
        metadata: {
          trainerUserId: 't1',
          platformFeeCents: 100,
          trainerShareCents: 900,
        },
        createdAt: new Date(),
      },
    ];
    em.find.mockResolvedValue(payments as unknown as Payment[]);
    const actual = await service.getRevenueBuckets({
      query: { bucket: ReportBucket.MONTH },
      trainerUserIdFilter: null,
    });
    expect(actual).toHaveLength(1);
    expect(actual[0]).toMatchObject({
      bucketStart: '2026-01-01T00:00:00.000Z',
      bucketEnd: '2026-02-01T00:00:00.000Z',
      currency: 'USD',
      gmvNetCents: 2000,
      platformFeeNetCents: 200,
      trainerShareNetCents: 1800,
      isEstimated: false,
    });
  });

  it('filters by trainerUserId when provided', async () => {
    const payments: FakePayment[] = [
      {
        status: PaymentStatus.PAID,
        amountCents: 5000,
        currency: 'USD',
        paidAt: new Date('2026-02-01T00:00:00.000Z'),
        refundedAt: null,
        metadata: {
          trainerUserId: 'keep-me',
          platformFeeCents: 500,
          trainerShareCents: 4500,
        },
        createdAt: new Date(),
      },
      {
        status: PaymentStatus.PAID,
        amountCents: 9999,
        currency: 'USD',
        paidAt: new Date('2026-02-02T00:00:00.000Z'),
        refundedAt: null,
        metadata: {
          trainerUserId: 'other',
          platformFeeCents: 999,
          trainerShareCents: 9000,
        },
        createdAt: new Date(),
      },
    ];
    em.find.mockResolvedValue(payments as unknown as Payment[]);
    const actual = await service.getRevenueBuckets({
      query: { bucket: ReportBucket.MONTH },
      trainerUserIdFilter: 'keep-me',
    });
    expect(actual[0]?.gmvNetCents).toBe(5000);
  });

  it('buckets payments when paidAt is an ISO string', async () => {
    const payments = [
      {
        status: PaymentStatus.PAID,
        amountCents: 4000,
        currency: 'USD',
        paidAt: '2026-03-10T12:00:00.000Z',
        refundedAt: null,
        metadata: {
          trainerUserId: 't1',
          platformFeeCents: 400,
          trainerShareCents: 3600,
        },
        createdAt: new Date(),
      },
    ];
    em.find.mockResolvedValue(payments as unknown as Payment[]);
    const actual = await service.getRevenueBuckets({
      query: { bucket: ReportBucket.MONTH },
      trainerUserIdFilter: null,
    });
    expect(actual).toHaveLength(1);
    expect(actual[0]?.bucketStart).toBe('2026-03-01T00:00:00.000Z');
  });

  it('skips payments that are not PAID or REFUNDED', async () => {
    const payments: FakePayment[] = [
      {
        status: PaymentStatus.PROCESSING,
        amountCents: 1,
        currency: 'USD',
        paidAt: new Date(),
        refundedAt: null,
        metadata: { trainerUserId: 't1' },
        createdAt: new Date(),
      } as unknown as FakePayment,
    ];
    em.find.mockResolvedValue(payments as unknown as Payment[]);

    const actual = await service.getRevenueBuckets({
      query: { bucket: ReportBucket.MONTH },
      trainerUserIdFilter: null,
    });

    expect(actual).toEqual([]);
  });

  it('skips payments when event date cannot be parsed', async () => {
    const payments: FakePayment[] = [
      {
        status: PaymentStatus.PAID,
        amountCents: 1000,
        currency: 'USD',
        paidAt: 'not-a-date',
        refundedAt: null,
        metadata: {
          trainerUserId: 't1',
          platformFeeCents: 100,
          trainerShareCents: 900,
        },
        createdAt: new Date(),
      } as unknown as FakePayment,
    ];
    em.find.mockResolvedValue(payments as unknown as Payment[]);

    const actual = await service.getRevenueBuckets({
      query: { bucket: ReportBucket.MONTH },
      trainerUserIdFilter: null,
    });

    expect(actual).toEqual([]);
  });

  it('marks bucket as estimated when split is estimated', async () => {
    process.env.PLATFORM_WORKOUT_FEE_BPS = '1000';
    const payments: FakePayment[] = [
      {
        status: PaymentStatus.PAID,
        amountCents: 1000,
        currency: 'USD',
        paidAt: new Date('2026-04-10T00:00:00.000Z'),
        refundedAt: null,
        metadata: { trainerUserId: 't1' },
        createdAt: new Date(),
      } as unknown as FakePayment,
    ];
    em.find.mockResolvedValue(payments as unknown as Payment[]);

    const actual = await service.getRevenueBuckets({
      query: { bucket: ReportBucket.MONTH },
      trainerUserIdFilter: null,
    });

    expect(actual).toHaveLength(1);
    expect(actual[0]?.isEstimated).toBe(true);
  });

  it('sorts by currency then bucketStart', async () => {
    const payments: FakePayment[] = [
      {
        status: PaymentStatus.PAID,
        amountCents: 1000,
        currency: 'EUR',
        paidAt: new Date('2026-05-10T00:00:00.000Z'),
        refundedAt: null,
        metadata: {
          trainerUserId: 't1',
          platformFeeCents: 100,
          trainerShareCents: 900,
        },
        createdAt: new Date(),
      } as unknown as FakePayment,
      {
        status: PaymentStatus.PAID,
        amountCents: 1000,
        currency: 'USD',
        paidAt: new Date('2026-04-10T00:00:00.000Z'),
        refundedAt: null,
        metadata: {
          trainerUserId: 't1',
          platformFeeCents: 100,
          trainerShareCents: 900,
        },
        createdAt: new Date(),
      } as unknown as FakePayment,
    ];
    em.find.mockResolvedValue(payments as unknown as Payment[]);

    const actual = await service.getRevenueBuckets({
      query: { bucket: ReportBucket.MONTH },
      trainerUserIdFilter: null,
    });

    expect(actual).toHaveLength(2);
    expect(actual[0]?.currency).toBe('EUR');
    expect(actual[1]?.currency).toBe('USD');
  });
});
