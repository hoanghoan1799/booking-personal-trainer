import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';

// Commons
import {
  BillableTargetType,
  BillingChargeStatus,
} from '../../common/enums/billing/billing.enum';

// Entities
import { BillingCharge } from './entities/billing-charge.entity';
import { Workout } from '../workout/entities/workout.entity';
import { User } from '../user/entities/user.entity';

// Repositories
import {
  BillingChargeRepositoryToken,
  type BillingChargeRepository,
} from './repositories/billing-charge.repository.interface';

export type CreateWorkoutChargeInput = {
  readonly workoutId: string;
  readonly payerUserId: string;
  readonly amountCents: number;
  readonly currency?: string;
  readonly metadata?: Record<string, unknown> | null;
  readonly expiresAt?: Date | null;
};

@Injectable()
export class BillingService {
  constructor(
    @Inject(BillingChargeRepositoryToken)
    private readonly billingChargeRepo: BillingChargeRepository,
    private readonly em: EntityManager,
  ) {}

  /**
   * Creates a draft billing charge (quote) for a workout.
   */
  async createWorkoutCharge(
    input: CreateWorkoutChargeInput,
  ): Promise<BillingCharge> {
    if (input.amountCents <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }
    const workout: Workout | null = await this.em.findOne(Workout, {
      id: input.workoutId,
      isDeleted: false,
    });
    if (!workout) {
      throw new NotFoundException('Workout not found');
    }
    return this.billingChargeRepo.create({
      targetType: BillableTargetType.WORKOUT,
      targetId: input.workoutId,
      payerUserId: input.payerUserId,
      amountCents: input.amountCents,
      currency: input.currency ?? 'USD',
      status: BillingChargeStatus.DRAFT,
      metadata: input.metadata ?? null,
      expiresAt: input.expiresAt ?? null,
    });
  }

  /**
   * Activates a draft charge and expires previous active charges for the same target.
   */
  async activateCharge(chargeId: string): Promise<BillingCharge> {
    const charge = await this.billingChargeRepo.findById(chargeId);
    if (!charge) {
      throw new NotFoundException('Billing charge not found');
    }
    if (charge.status !== BillingChargeStatus.DRAFT) {
      return charge;
    }
    await this.em.transactional(async () => {
      await this.expireOldChargesForTarget({
        targetType: charge.targetType,
        targetId: charge.targetId,
      });
      charge.status = BillingChargeStatus.ACTIVE;
      await this.billingChargeRepo.save(charge);
    });
    return charge;
  }

  /**
   * Expires all ACTIVE charges for a given target.
   */
  async expireOldChargesForTarget(input: {
    readonly targetType: BillableTargetType;
    readonly targetId: string;
  }): Promise<number> {
    return this.billingChargeRepo.expireMany({
      targetType: input.targetType,
      targetId: input.targetId,
      status: BillingChargeStatus.ACTIVE,
    });
  }

  /**
   * Returns the latest ACTIVE billing charge for the given workout.
   */
  async getLatestActiveWorkoutCharge(
    workoutId: string,
  ): Promise<BillingCharge | null> {
    return this.billingChargeRepo.findLatestActiveForTarget(
      BillableTargetType.WORKOUT,
      workoutId,
    );
  }

  /**
   * Creates a DRAFT workout charge and activates it inside the provided transaction.
   * This is the ACID-safe variant for flows that must atomically create domain records + billing.
   */
  async createAndActivateWorkoutChargeAtomic(input: {
    readonly em: EntityManager;
    readonly workoutId: string;
    readonly payerUserId: string;
    readonly amountCents: number;
    readonly currency: string;
    readonly metadata?: Record<string, unknown> | null;
    readonly expiresAt?: Date | null;
  }): Promise<BillingCharge> {
    if (input.amountCents <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }
    const workout: Workout | null = await input.em.findOne(Workout, {
      id: input.workoutId,
      isDeleted: false,
    });
    if (!workout) {
      throw new NotFoundException('Workout not found');
    }
    await input.em.nativeUpdate(
      BillingCharge,
      {
        targetType: BillableTargetType.WORKOUT,
        targetId: input.workoutId,
        status: BillingChargeStatus.ACTIVE,
      },
      {
        status: BillingChargeStatus.EXPIRED,
      },
    );
    const charge = input.em.create(BillingCharge, {
      targetType: BillableTargetType.WORKOUT,
      targetId: input.workoutId,
      payer: input.em.getReference(User, input.payerUserId),
      amountCents: input.amountCents,
      currency: input.currency,
      status: BillingChargeStatus.ACTIVE,
      metadata: input.metadata ?? null,
      expiresAt: input.expiresAt ?? null,
    });
    await input.em.persist(charge).flush();
    return charge;
  }
}
