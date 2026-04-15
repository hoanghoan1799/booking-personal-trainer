import { Injectable } from '@nestjs/common';

// Commons
import { PaymentStatus } from '../../common/enums/billing/billing.enum';

// Services
import { BillingService } from '../billing/billing.service';

// Repositories
import {
  PaymentRepositoryToken,
  type PaymentRepository,
} from './repositories/payment.repository.interface';
import { Inject } from '@nestjs/common';

export type WorkoutPaymentAccessSnapshot = {
  readonly isPaid: boolean;
  readonly billingChargeId: string | null;
  readonly amountCents: number | null;
  readonly currency: string | null;
};

@Injectable()
export class WorkoutPaymentPolicyService {
  constructor(
    private readonly billingService: BillingService,
    @Inject(PaymentRepositoryToken)
    private readonly paymentRepo: PaymentRepository,
  ) {}

  async isWorkoutPaid(input: { readonly workoutId: string }): Promise<boolean> {
    const snapshot = await this.getWorkoutPaymentAccessSnapshot({
      workoutId: input.workoutId,
    });
    return snapshot.isPaid;
  }

  async getWorkoutPaymentAccessSnapshot(input: {
    readonly workoutId: string;
  }): Promise<WorkoutPaymentAccessSnapshot> {
    const activeCharge = await this.billingService.getLatestActiveWorkoutCharge(
      input.workoutId,
    );
    if (!activeCharge) {
      return {
        isPaid: false,
        billingChargeId: null,
        amountCents: null,
        currency: null,
      };
    }
    const paidCount = await this.paymentRepo.countPaidForBillingCharge(
      activeCharge.id,
    );
    return {
      isPaid: paidCount > 0,
      billingChargeId: activeCharge.id,
      amountCents: activeCharge.amountCents,
      currency: activeCharge.currency,
    };
  }

  async assertWorkoutPaid(input: {
    readonly workoutId: string;
  }): Promise<void> {
    const isPaid = await this.isWorkoutPaid({ workoutId: input.workoutId });
    if (isPaid) return;
    throw new Error(`Workout payment required (${PaymentStatus.PAID})`);
  }
}
