import { Entity, Enum, Index, ManyToOne, Property } from '@mikro-orm/core';
import { Expose } from 'class-transformer';

// Commons
import { BaseEntity } from '../../../common/entities/base.entity';
import {
  BillableTargetType,
  BillingChargeStatus,
} from '../../../common/enums/billing/billing.enum';

// Entities
import { User } from '../../user/entities/user.entity';

type BillingChargeMetadata = Record<string, unknown>;

@Index({ properties: ['targetType', 'targetId'] })
@Index({ properties: ['payer'] })
@Index({ properties: ['status'] })
@Index({ properties: ['expiresAt'] })
@Entity({ tableName: 'billing_charges' })
export class BillingCharge extends BaseEntity {
  @Expose()
  @Enum(() => BillableTargetType)
  targetType!: BillableTargetType;

  @Expose()
  @Property({ type: 'uuid' })
  targetId!: string;

  @Expose()
  @ManyToOne(() => User)
  payer!: User;

  @Expose()
  @Property()
  amountCents!: number;

  @Expose()
  @Property({ default: 'USD' })
  currency: string = 'USD';

  @Expose()
  @Enum(() => BillingChargeStatus)
  status: BillingChargeStatus = BillingChargeStatus.DRAFT;

  @Expose()
  @Property({ type: 'json', nullable: true })
  metadata?: BillingChargeMetadata | null;

  @Expose()
  @Property({ nullable: true })
  expiresAt?: Date | null;
}
