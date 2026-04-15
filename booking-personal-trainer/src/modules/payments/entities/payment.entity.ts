import {
  Entity,
  Enum,
  Index,
  ManyToOne,
  Property,
  Unique,
} from '@mikro-orm/core';
import { Expose } from 'class-transformer';

// Commons
import { BaseEntity } from '../../../common/entities/base.entity';
import {
  BillableTargetType,
  PaymentStatus,
} from '../../../common/enums/billing/billing.enum';

// Entities
import { User } from '../../user/entities/user.entity';
import { BillingCharge } from '../../billing/entities/billing-charge.entity';

type PaymentMetadata = Record<string, unknown>;

@Index({ properties: ['targetType', 'targetId'] })
@Index({ properties: ['payer'] })
@Index({ properties: ['billingCharge'] })
@Index({ properties: ['status'] })
@Index({ properties: ['provider'] })
@Index({ properties: ['paidAt'] })
@Index({ properties: ['refundedAt'] })
@Unique({ properties: ['providerPaymentIntentId'] })
@Entity({ tableName: 'payments' })
export class Payment extends BaseEntity {
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
  @ManyToOne(() => BillingCharge, { nullable: true })
  billingCharge?: BillingCharge | null;

  @Expose()
  @Property()
  amountCents!: number;

  @Expose()
  @Property({ default: 'USD' })
  currency: string = 'USD';

  @Expose()
  @Enum(() => PaymentStatus)
  status: PaymentStatus = PaymentStatus.REQUIRES_PAYMENT_METHOD;

  @Expose()
  @Property({ default: 'stripe' })
  provider: string = 'stripe';

  @Expose()
  @Property()
  providerPaymentIntentId!: string;

  @Expose()
  @Property({ type: 'json', nullable: true })
  metadata?: PaymentMetadata | null;

  @Expose()
  @Property({ type: 'text', nullable: true })
  failureReason?: string | null;

  @Expose()
  @Property({ nullable: true })
  paidAt?: Date | null;

  @Expose()
  @Property({ nullable: true })
  refundedAt?: Date | null;
}
