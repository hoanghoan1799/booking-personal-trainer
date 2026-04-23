import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from '@mikro-orm/core';

// Commons
import { PaymentStatus } from '../../../../common/enums/billing/billing.enum';

// Entities
import { Payment } from '../../entities/payment.entity';

// Services
import { TrainerPayoutsService } from '../trainer-payouts.service';

describe('TrainerPayoutsService', () => {
  let service: TrainerPayoutsService;
  let em: {
    find: jest.Mock<Promise<Payment[]>, [typeof Payment, unknown, unknown]>;
  };

  beforeEach(async () => {
    em = {
      find: jest.fn<Promise<Payment[]>, [typeof Payment, unknown, unknown]>(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TrainerPayoutsService,
        {
          provide: EntityManager,
          useValue: em,
        },
      ],
    }).compile();

    service = module.get<TrainerPayoutsService>(TrainerPayoutsService);
  });

  it('should build summary and rows for matching trainer payments', async () => {
    process.env.PLATFORM_WORKOUT_FEE_BPS = '1000';
    em.find.mockResolvedValue([
      {
        id: 'p1',
        currency: 'USD',
        amountCents: 1000,
        status: PaymentStatus.PAID,
        metadata: {
          trainerUserId: 'trainer-1',
          trainerShareCents: 800,
          trainerPayout: { status: 'TRANSFERRED', transferId: 'tr_1' },
        },
      } as unknown as Payment,
      {
        id: 'p2',
        currency: 'USD',
        amountCents: 1000,
        status: PaymentStatus.REFUNDED,
        metadata: {
          trainerUserId: 'trainer-1',
          trainerPayout: { status: 'FAILED', errorMessage: 'x' },
        },
      } as unknown as Payment,
      {
        id: 'p3',
        currency: 'USD',
        amountCents: 1000,
        status: PaymentStatus.PAID,
        metadata: {
          trainerUserId: 'other',
        },
      } as unknown as Payment,
    ]);

    const actual = await service.getMyPayouts({
      trainerId: 'trainer-1',
      query: {},
    });

    expect(actual.summary.length).toBe(1);
    expect(actual.summary[0]?.currency).toBe('USD');
    expect(actual.summary[0]?.paidTrainerShareCents).toBe(800);
    expect(actual.summary[0]?.refundedTrainerShareCents).toBeGreaterThanOrEqual(
      0,
    );
    expect(actual.rows.length).toBe(2);
    expect(actual.rows[0]?.paymentId).toBeDefined();
  });

  it('should return empty when no payments match trainer id', async () => {
    em.find.mockResolvedValue([
      {
        id: 'p1',
        currency: 'USD',
        amountCents: 1000,
        status: PaymentStatus.PAID,
        metadata: { trainerUserId: 'other' },
      } as unknown as Payment,
    ]);

    const actual = await service.getMyPayouts({
      trainerId: 'trainer-1',
      query: {},
    });

    expect(actual.summary).toEqual([]);
    expect(actual.rows).toEqual([]);
  });

  it('should filter by currency (case-insensitive) and by date ranges', async () => {
    const inputFrom = new Date('2030-01-01T00:00:00.000Z');
    const inputTo = new Date('2030-02-01T00:00:00.000Z');
    em.find.mockResolvedValue([]);

    await service.getMyPayouts({
      trainerId: 'trainer-1',
      query: {
        currency: ' usd ',
        from: inputFrom,
        to: inputTo,
      },
    });

    expect(em.find).toHaveBeenCalledTimes(1);
    const whereArg: unknown = em.find.mock.calls[0][1];
    const optionsArg: unknown = em.find.mock.calls[0][2];
    expect(whereArg).toBeTruthy();
    expect(typeof whereArg).toBe('object');
    const where = whereArg as Record<string, unknown>;
    expect(where.currency).toBe('USD');
    expect(where.$or).toBeTruthy();
    expect(Array.isArray(where.$or)).toBe(true);
    expect(optionsArg).toBeTruthy();
    expect(typeof optionsArg).toBe('object');
  });
});
