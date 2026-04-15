import { PaymentStatus } from '../../../common/enums/billing/billing.enum';
import { Payment } from '../entities/payment.entity';

/** Injection token for PaymentRepository */
export const PaymentRepositoryToken = Symbol('PaymentRepository');

export type CreatePaymentData = {
  readonly targetType: string;
  readonly targetId: string;
  readonly payerUserId: string;
  readonly billingChargeId?: string | null;
  readonly amountCents: number;
  readonly currency: string;
  readonly status: PaymentStatus;
  readonly provider: string;
  readonly providerPaymentIntentId: string;
  readonly metadata?: Record<string, unknown> | null;
};

export interface PaymentRepository {
  create(data: CreatePaymentData): Promise<Payment>;
  findByProviderPaymentIntentId(
    providerPaymentIntentId: string,
  ): Promise<Payment | null>;
  countPaidForBillingCharge(billingChargeId: string): Promise<number>;
  save(payment: Payment): Promise<void>;
}
