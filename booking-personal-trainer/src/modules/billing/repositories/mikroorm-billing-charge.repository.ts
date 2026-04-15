import { Injectable } from '@nestjs/common';
import { EntityManager, EntityRepository } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';

// Commons
import {
  BillableTargetType,
  BillingChargeStatus,
} from '../../../common/enums/billing/billing.enum';

// Entities
import { BillingCharge } from '../entities/billing-charge.entity';
import { User } from '../../user/entities/user.entity';

// Repositories
import type {
  BillingChargeRepository,
  CreateBillingChargeData,
  ExpireBillingChargesFilter,
} from './billing-charge.repository.interface';

@Injectable()
export class MikroOrmBillingChargeRepository implements BillingChargeRepository {
  constructor(
    @InjectRepository(BillingCharge)
    private readonly repo: EntityRepository<BillingCharge>,
    private readonly em: EntityManager,
  ) {}

  async create(data: CreateBillingChargeData): Promise<BillingCharge> {
    const charge = this.repo.create({
      targetType: data.targetType,
      targetId: data.targetId,
      payer: this.em.getReference(User, data.payerUserId),
      amountCents: data.amountCents,
      currency: data.currency,
      status: data.status,
      metadata: data.metadata ?? null,
      expiresAt: data.expiresAt ?? null,
    });
    await this.em.persist(charge).flush();
    return charge;
  }

  async findById(id: string): Promise<BillingCharge | null> {
    return this.repo.findOne({ id }, { populate: ['payer'] });
  }

  async findLatestActiveForTarget(
    targetType: BillableTargetType,
    targetId: string,
  ): Promise<BillingCharge | null> {
    return this.repo.findOne(
      { targetType, targetId, status: BillingChargeStatus.ACTIVE },
      { orderBy: { createdAt: 'DESC' }, populate: ['payer'] },
    );
  }

  async expireMany(filter: ExpireBillingChargesFilter): Promise<number> {
    return this.em.nativeUpdate(
      BillingCharge,
      {
        targetType: filter.targetType,
        targetId: filter.targetId,
        status: filter.status,
      },
      {
        status: BillingChargeStatus.EXPIRED,
        updatedAt: new Date(),
      },
    );
  }

  async save(charge: BillingCharge): Promise<void> {
    await this.em.persist(charge).flush();
  }
}
