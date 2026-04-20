import { Injectable } from '@nestjs/common';
import { EntityManager, EntityRepository } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';

// Commons
import { PaymentStatus } from '../../../common/enums/billing/billing.enum';

// Entities
import { Payment } from '../entities/payment.entity';
import { User } from '../../user/entities/user.entity';
import { BillingCharge } from '../../billing/entities/billing-charge.entity';

// Repositories
import type {
  CreatePaymentData,
  PaymentRepository,
} from './payment.repository.interface';

@Injectable()
export class MikroOrmPaymentRepository implements PaymentRepository {
  constructor(
    @InjectRepository(Payment)
    private readonly repo: EntityRepository<Payment>,
    private readonly em: EntityManager,
  ) {}

  async create(data: CreatePaymentData): Promise<Payment> {
    const payment = this.repo.create({
      targetType: data.targetType as never,
      targetId: data.targetId,
      payer: this.em.getReference(User, data.payerUserId),
      billingCharge: data.billingChargeId
        ? this.em.getReference(BillingCharge, data.billingChargeId)
        : null,
      amountCents: data.amountCents,
      currency: data.currency,
      status: data.status ?? PaymentStatus.REQUIRES_PAYMENT_METHOD,
      provider: data.provider,
      providerPaymentIntentId: data.providerPaymentIntentId ?? null,
      idempotencyKey: data.idempotencyKey ?? null,
      metadata: data.metadata ?? null,
    });
    await this.em.persist(payment).flush();
    return payment;
  }

  async findByProviderAndIdempotencyKey(input: {
    readonly provider: string;
    readonly idempotencyKey: string;
  }): Promise<Payment | null> {
    return this.repo.findOne(
      { provider: input.provider, idempotencyKey: input.idempotencyKey },
      { populate: ['payer', 'billingCharge'] },
    );
  }

  async findByProviderPaymentIntentId(
    providerPaymentIntentId: string,
  ): Promise<Payment | null> {
    return this.repo.findOne(
      { providerPaymentIntentId },
      { populate: ['payer', 'billingCharge'] },
    );
  }

  async countPaidForBillingCharge(billingChargeId: string): Promise<number> {
    return this.repo.count({
      billingCharge: billingChargeId,
      status: PaymentStatus.PAID,
    });
  }

  async save(payment: Payment): Promise<void> {
    await this.em.persist(payment).flush();
  }
}
