import {
  BillableTargetType,
  BillingChargeStatus,
} from '../../../common/enums/billing/billing.enum';
import { BillingCharge } from '../entities/billing-charge.entity';

/** Injection token for BillingChargeRepository */
export const BillingChargeRepositoryToken = Symbol('BillingChargeRepository');

export type CreateBillingChargeData = {
  readonly targetType: BillableTargetType;
  readonly targetId: string;
  readonly payerUserId: string;
  readonly amountCents: number;
  readonly currency: string;
  readonly status: BillingChargeStatus;
  readonly metadata?: Record<string, unknown> | null;
  readonly expiresAt?: Date | null;
};

export type ExpireBillingChargesFilter = {
  readonly targetType: BillableTargetType;
  readonly targetId: string;
  readonly status: BillingChargeStatus;
};

export interface BillingChargeRepository {
  create(data: CreateBillingChargeData): Promise<BillingCharge>;
  findById(id: string): Promise<BillingCharge | null>;
  findLatestActiveForTarget(
    targetType: BillableTargetType,
    targetId: string,
  ): Promise<BillingCharge | null>;
  expireMany(filter: ExpireBillingChargesFilter): Promise<number>;
  save(charge: BillingCharge): Promise<void>;
}
