import { Test, TestingModule } from '@nestjs/testing';

import { BillingService } from '../billing/billing.service';
import { PaymentRepositoryToken } from './repositories/payment.repository.interface';
import { WorkoutPaymentPolicyService } from './workout-payment-policy.service';

describe('WorkoutPaymentPolicyService', () => {
  let service: WorkoutPaymentPolicyService;
  let billingService: { getLatestActiveWorkoutCharge: jest.Mock };
  let paymentRepo: { countPaidForBillingCharge: jest.Mock };

  beforeEach(async () => {
    billingService = { getLatestActiveWorkoutCharge: jest.fn() };
    paymentRepo = { countPaidForBillingCharge: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkoutPaymentPolicyService,
        { provide: BillingService, useValue: billingService },
        { provide: PaymentRepositoryToken, useValue: paymentRepo },
      ],
    }).compile();

    service = module.get<WorkoutPaymentPolicyService>(
      WorkoutPaymentPolicyService,
    );
  });

  it('should return false when no active charge', async () => {
    billingService.getLatestActiveWorkoutCharge.mockResolvedValue(null);

    const actual = await service.isWorkoutPaid({ workoutId: 'workout-id' });

    expect(actual).toBe(false);
  });

  it('should return true when at least one PAID payment exists for active charge', async () => {
    billingService.getLatestActiveWorkoutCharge.mockResolvedValue({
      id: 'charge-id',
    });
    paymentRepo.countPaidForBillingCharge.mockResolvedValue(1);

    const actual = await service.isWorkoutPaid({ workoutId: 'workout-id' });

    expect(actual).toBe(true);
  });

  it('should return unpaid snapshot with charge + price when active charge exists but no paid payments', async () => {
    billingService.getLatestActiveWorkoutCharge.mockResolvedValue({
      id: 'charge-id',
      amountCents: 4999,
      currency: 'USD',
    });
    paymentRepo.countPaidForBillingCharge.mockResolvedValue(0);

    const actual = await service.getWorkoutPaymentAccessSnapshot({
      workoutId: 'workout-id',
    });

    expect(actual).toEqual({
      isPaid: false,
      billingChargeId: 'charge-id',
      amountCents: 4999,
      currency: 'USD',
    });
  });

  it('should return paid snapshot when active charge exists and paid payments exist', async () => {
    billingService.getLatestActiveWorkoutCharge.mockResolvedValue({
      id: 'charge-id',
      amountCents: 4999,
      currency: 'USD',
    });
    paymentRepo.countPaidForBillingCharge.mockResolvedValue(2);

    const actual = await service.getWorkoutPaymentAccessSnapshot({
      workoutId: 'workout-id',
    });

    expect(actual).toEqual({
      isPaid: true,
      billingChargeId: 'charge-id',
      amountCents: 4999,
      currency: 'USD',
    });
  });
});
