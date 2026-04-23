import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from '@mikro-orm/core';

import { PaymentStatus } from '../../../../common/enums/billing/billing.enum';
import { AdminEarningsService } from '../admin-earnings.service';
import { Payment } from '../../entities/payment.entity';
import { User } from '../../../user/entities/user.entity';

type FakeUser = Pick<
  User,
  'id' | 'email' | 'userName' | 'firstName' | 'lastName'
>;

type FakePayment = Pick<
  Payment,
  'status' | 'amountCents' | 'currency' | 'paidAt' | 'refundedAt' | 'metadata'
>;

type FakePaymentWithPayer = FakePayment & { payer: FakeUser };

describe('AdminEarningsService', () => {
  let service: AdminEarningsService;
  let em: { find: jest.Mock };

  const createUser = (input: Partial<FakeUser> & { id: string }): FakeUser => ({
    id: input.id,
    email: input.email ?? `${input.id}@example.com`,
    userName: input.userName ?? input.id,
    firstName: input.firstName ?? '',
    lastName: input.lastName ?? '',
  });

  const createPayment = (
    input: Partial<FakePaymentWithPayer> & { payer: FakeUser },
  ): FakePaymentWithPayer => ({
    status: input.status ?? PaymentStatus.PAID,
    amountCents: input.amountCents ?? 1000,
    currency: input.currency ?? 'USD',
    paidAt: input.paidAt ?? new Date('2026-01-10T00:00:00.000Z'),
    refundedAt: input.refundedAt ?? null,
    metadata: input.metadata ?? null,
    payer: input.payer,
  });

  beforeEach(async () => {
    em = { find: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminEarningsService,
        { provide: EntityManager, useValue: em },
      ],
    }).compile();

    service = module.get(AdminEarningsService);
  });

  it('returns empty arrays when there are no payments', async () => {
    em.find.mockImplementation((entity: unknown) => {
      if (entity === Payment) return [] as unknown as Payment[];
      if (entity === User) return [] as unknown as User[];
      return [];
    });

    const result = await service.getEarnings({});

    expect(result).toEqual({ totals: [], trainees: [], trainers: [] });
  });

  it('aggregates totals and payer rows for PAID/REFUNDED, grouped by currency', async () => {
    const traineeA = createUser({
      id: 'trainee-a',
      firstName: 'Trainee',
      lastName: 'A',
    });
    const traineeB = createUser({
      id: 'trainee-b',
      firstName: 'Trainee',
      lastName: 'B',
    });
    const trainer1 = createUser({
      id: 'trainer-1',
      firstName: 'Trainer',
      lastName: 'One',
    });

    const payments: FakePaymentWithPayer[] = [
      createPayment({
        payer: traineeA,
        status: PaymentStatus.PAID,
        amountCents: 5000,
        currency: 'USD',
        metadata: {
          trainerUserId: trainer1.id,
          platformFeeCents: 500,
          trainerShareCents: 4500,
        },
      }),
      createPayment({
        payer: traineeA,
        status: PaymentStatus.REFUNDED,
        amountCents: 2000,
        currency: 'USD',
        refundedAt: new Date('2026-01-12T00:00:00.000Z'),
        metadata: {
          trainerUserId: trainer1.id,
          platformFeeCents: 200,
          trainerShareCents: 1800,
        },
      }),
      createPayment({
        payer: traineeB,
        status: PaymentStatus.PAID,
        amountCents: 1000,
        currency: 'EUR',
        metadata: {
          trainerUserId: trainer1.id,
          platformFeeCents: 100,
          trainerShareCents: 900,
        },
      }),
    ];

    em.find.mockImplementation((entity: unknown) => {
      if (entity === Payment) return payments as unknown as Payment[];
      if (entity === User) return [trainer1] as unknown as User[];
      return [];
    });

    const result = await service.getEarnings({});

    const usd = result.totals.find((t) => t.currency === 'USD');
    expect(usd).toEqual({
      currency: 'USD',
      grossPaidCents: 5000,
      grossRefundedCents: 2000,
      grossNetCents: 3000,
      platformFeePaidCents: 500,
      platformFeeRefundedCents: 200,
      platformFeeNetCents: 300,
      trainerSharePaidCents: 4500,
      trainerShareRefundedCents: 1800,
      trainerShareNetCents: 2700,
      isEstimated: false,
    });

    const traineeUsd = result.trainees.find(
      (t) => t.currency === 'USD' && t.traineeId === traineeA.id,
    );
    expect(traineeUsd).toEqual({
      traineeId: traineeA.id,
      traineeName: 'Trainee A',
      traineeEmail: traineeA.email,
      currency: 'USD',
      paidCount: 1,
      grossPaidCents: 5000,
      grossRefundedCents: 2000,
      grossNetCents: 3000,
    });

    const trainerUsd = result.trainers.find(
      (t) => t.currency === 'USD' && t.trainerId === trainer1.id,
    );
    expect(trainerUsd?.trainerShareNetCents).toBe(2700);
  });

  it('marks totals as estimated when split metadata is missing', async () => {
    const trainee = createUser({ id: 'trainee' });
    const trainer = createUser({ id: 'trainer' });
    const payments: FakePaymentWithPayer[] = [
      createPayment({
        payer: trainee,
        status: PaymentStatus.PAID,
        amountCents: 1234,
        currency: 'USD',
        metadata: { trainerUserId: trainer.id },
      }),
    ];

    em.find.mockImplementation((entity: unknown) => {
      if (entity === Payment) return payments as unknown as Payment[];
      if (entity === User) return [trainer] as unknown as User[];
      return [];
    });

    const result = await service.getEarnings({});
    const usd = result.totals.find((t) => t.currency === 'USD');
    expect(usd?.isEstimated).toBe(true);
    expect(usd?.grossPaidCents).toBe(1234);
  });

  it('skips payments that are neither PAID nor REFUNDED', async () => {
    const trainee = createUser({ id: 'trainee' });
    const payments: FakePaymentWithPayer[] = [
      createPayment({
        payer: trainee,
        status: PaymentStatus.PROCESSING,
        amountCents: 1234,
        currency: 'USD',
        metadata: { trainerUserId: 'trainer' },
      }),
    ];
    em.find.mockImplementation((entity: unknown) => {
      if (entity === Payment) return payments as unknown as Payment[];
      if (entity === User) return [] as unknown as User[];
      return [];
    });

    const result = await service.getEarnings({});

    expect(result.totals).toHaveLength(1);
    expect(result.totals[0]?.grossNetCents).toBe(0);
    expect(result.trainees).toHaveLength(0);
    expect(result.trainers).toHaveLength(0);
  });

  it('counts payout statuses when trainerPayout status exists', async () => {
    const trainee = createUser({ id: 'trainee' });
    const trainer = createUser({ id: 'trainer', firstName: '', lastName: '' });
    const payments: FakePaymentWithPayer[] = [
      createPayment({
        payer: trainee,
        status: PaymentStatus.PAID,
        amountCents: 1000,
        currency: 'usd',
        metadata: {
          trainerUserId: trainer.id,
          platformFeeCents: 100,
          trainerShareCents: 900,
          trainerPayout: { status: 'paid' },
        },
      }),
      createPayment({
        payer: trainee,
        status: PaymentStatus.PAID,
        amountCents: 2000,
        currency: 'USD',
        metadata: {
          trainerUserId: trainer.id,
          platformFeeCents: 200,
          trainerShareCents: 1800,
          trainerPayout: { status: 'paid' },
        },
      }),
    ];
    em.find.mockImplementation((entity: unknown) => {
      if (entity === Payment) return payments as unknown as Payment[];
      if (entity === User) return [trainer] as unknown as User[];
      return [];
    });

    const result = await service.getEarnings({ currency: '  usd  ' });

    expect(result.totals).toHaveLength(1);
    expect(result.totals[0]?.currency).toBe('USD');
    expect(result.trainers).toHaveLength(1);
    expect(result.trainers[0]?.payout.statusCounts.paid).toBe(2);
  });

  it('handles missing trainer user while still aggregating trainer rows', async () => {
    const trainee = createUser({ id: 'trainee' });
    const payments: FakePaymentWithPayer[] = [
      createPayment({
        payer: trainee,
        status: PaymentStatus.PAID,
        amountCents: 1000,
        currency: 'USD',
        metadata: {
          trainerUserId: 'trainer-missing',
          platformFeeCents: 100,
          trainerShareCents: 900,
        },
      }),
    ];
    em.find.mockImplementation((entity: unknown) => {
      if (entity === Payment) return payments as unknown as Payment[];
      if (entity === User) return [] as unknown as User[];
      return [];
    });

    const result = await service.getEarnings({});

    expect(result.trainers).toHaveLength(1);
    expect(result.trainers[0]).toMatchObject({
      trainerId: 'trainer-missing',
      trainerName: '',
      trainerEmail: '',
      trainerShareNetCents: 900,
    });
  });

  it('aggregates multiple payments for the same trainee/currency into one row', async () => {
    const trainee = createUser({ id: 'trainee', firstName: '', lastName: '' });
    const payments: FakePaymentWithPayer[] = [
      createPayment({
        payer: trainee,
        status: PaymentStatus.PAID,
        amountCents: 500,
        currency: 'USD',
        metadata: { platformFeeCents: 50, trainerShareCents: 450 },
      }),
      createPayment({
        payer: trainee,
        status: PaymentStatus.PAID,
        amountCents: 700,
        currency: 'USD',
        metadata: { platformFeeCents: 70, trainerShareCents: 630 },
      }),
    ];
    em.find.mockImplementation((entity: unknown) => {
      if (entity === Payment) return payments as unknown as Payment[];
      if (entity === User) return [] as unknown as User[];
      return [];
    });

    const result = await service.getEarnings({});

    expect(result.trainees).toHaveLength(1);
    expect(result.trainees[0]).toMatchObject({
      traineeId: 'trainee',
      traineeName: 'trainee',
      grossPaidCents: 1200,
      grossNetCents: 1200,
      paidCount: 2,
    });
  });

  it('filters by date range using paidAt/refundedAt depending on status', async () => {
    const trainee = createUser({ id: 'trainee' });
    const trainer = createUser({ id: 'trainer' });
    const payments: FakePaymentWithPayer[] = [
      createPayment({
        payer: trainee,
        status: PaymentStatus.PAID,
        amountCents: 1000,
        currency: 'USD',
        paidAt: new Date('2026-01-05T00:00:00.000Z'),
        metadata: {
          trainerUserId: trainer.id,
          platformFeeCents: 100,
          trainerShareCents: 900,
        },
      }),
      createPayment({
        payer: trainee,
        status: PaymentStatus.REFUNDED,
        amountCents: 1000,
        currency: 'USD',
        refundedAt: new Date('2026-01-20T00:00:00.000Z'),
        metadata: {
          trainerUserId: trainer.id,
          platformFeeCents: 100,
          trainerShareCents: 900,
        },
      }),
    ];

    em.find.mockImplementation((entity: unknown, where: unknown) => {
      if (entity === Payment) {
        const hasOr =
          typeof where === 'object' &&
          where != null &&
          '$or' in (where as Record<string, unknown>);
        expect(hasOr).toBe(true);
        return payments as unknown as Payment[];
      }
      if (entity === User) return [trainer] as unknown as User[];
      return [];
    });

    const result = await service.getEarnings({
      from: new Date('2026-01-01T00:00:00.000Z'),
      to: new Date('2026-02-01T00:00:00.000Z'),
    });

    const usd = result.totals.find((t) => t.currency === 'USD');
    expect(usd?.grossNetCents).toBe(0);
  });
});
