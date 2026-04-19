import { Injectable } from '@nestjs/common';
import { EntityManager, FilterQuery } from '@mikro-orm/core';

import { PaymentStatus } from '../../common/enums/billing/billing.enum';

import { PaymentSplitAggregationHelper } from './helpers/payment-split-aggregation.helper';
import { Payment } from './entities/payment.entity';
import { User } from '../user/entities/user.entity';
import { AdminEarningsQueryDto } from './dtos/admin-earnings-query.dto';
import {
  AdminEarningsResponseDto,
  AdminEarningsTotalsDto,
  AdminEarningsTraineeRowDto,
  AdminEarningsTrainerRowDto,
} from './dtos/admin-earnings-response.dto';

@Injectable()
export class AdminEarningsService {
  constructor(private readonly em: EntityManager) {}

  async getEarnings(
    query: AdminEarningsQueryDto,
  ): Promise<AdminEarningsResponseDto> {
    const normalizedCurrency: string | null =
      query.currency != null && query.currency.trim() !== ''
        ? query.currency.trim().toUpperCase()
        : null;

    const where: FilterQuery<Payment> =
      PaymentSplitAggregationHelper.buildPaidRefundedDateFilter({
        from: query.from,
        to: query.to,
        currency: normalizedCurrency,
      });

    const payments: Payment[] = await this.em.find(Payment, where, {
      populate: ['payer'],
      orderBy: { createdAt: 'DESC' },
    });

    const trainerIds: string[] = this.collectTrainerIds(payments);
    const trainersById: Map<string, User> =
      await this.loadUsersById(trainerIds);

    const totalsByCurrency = new Map<string, AdminEarningsTotalsDto>();
    const traineesByKey = new Map<string, AdminEarningsTraineeRowDto>();
    const trainersByKey = new Map<string, AdminEarningsTrainerRowDto>();

    for (const payment of payments) {
      const currency: string = (payment.currency ?? 'USD').toUpperCase();
      const totals: AdminEarningsTotalsDto = this.getOrCreateTotals(
        totalsByCurrency,
        currency,
      );

      const payoutStatus: string | null = this.readTrainerPayoutStatus(
        payment.metadata,
      );

      const isPaid = payment.status === PaymentStatus.PAID;
      const isRefunded = payment.status === PaymentStatus.REFUNDED;
      if (!isPaid && !isRefunded) {
        continue;
      }

      const grossCents: number = payment.amountCents;
      const { platformFeeCents, trainerShareCents, isEstimated } =
        PaymentSplitAggregationHelper.readOrEstimateSplit({
          payment,
        });

      if (isEstimated) {
        totals.isEstimated = true;
      }

      if (isPaid) {
        totals.grossPaidCents += grossCents;
        totals.platformFeePaidCents += platformFeeCents;
        totals.trainerSharePaidCents += trainerShareCents;
      } else {
        totals.grossRefundedCents += grossCents;
        totals.platformFeeRefundedCents += platformFeeCents;
        totals.trainerShareRefundedCents += trainerShareCents;
      }
      totals.grossNetCents = totals.grossPaidCents - totals.grossRefundedCents;
      totals.platformFeeNetCents =
        totals.platformFeePaidCents - totals.platformFeeRefundedCents;
      totals.trainerShareNetCents =
        totals.trainerSharePaidCents - totals.trainerShareRefundedCents;

      const traineeRow: AdminEarningsTraineeRowDto = this.getOrCreateTraineeRow(
        traineesByKey,
        payment,
        currency,
      );
      if (isPaid) {
        traineeRow.paidCount += 1;
        traineeRow.grossPaidCents += grossCents;
      } else {
        traineeRow.grossRefundedCents += grossCents;
      }
      traineeRow.grossNetCents =
        traineeRow.grossPaidCents - traineeRow.grossRefundedCents;

      const trainerId: string | null =
        PaymentSplitAggregationHelper.readTrainerUserId(payment.metadata);
      if (trainerId) {
        const trainerUser: User | undefined = trainersById.get(trainerId);
        const trainerRow: AdminEarningsTrainerRowDto =
          this.getOrCreateTrainerRow(trainersByKey, {
            trainerId,
            trainerUser,
            currency,
          });

        if (isPaid) {
          trainerRow.trainerSharePaidCents += trainerShareCents;
        } else {
          trainerRow.trainerShareRefundedCents += trainerShareCents;
        }
        trainerRow.trainerShareNetCents =
          trainerRow.trainerSharePaidCents -
          trainerRow.trainerShareRefundedCents;

        if (payoutStatus) {
          trainerRow.payout.statusCounts[payoutStatus] =
            (trainerRow.payout.statusCounts[payoutStatus] ?? 0) + 1;
        }
      }
    }

    const totals: AdminEarningsTotalsDto[] = Array.from(
      totalsByCurrency.values(),
    ).sort((a, b) => a.currency.localeCompare(b.currency));

    const trainees: AdminEarningsTraineeRowDto[] = Array.from(
      traineesByKey.values(),
    ).sort((a, b) => b.grossNetCents - a.grossNetCents);

    const trainers: AdminEarningsTrainerRowDto[] = Array.from(
      trainersByKey.values(),
    ).sort((a, b) => b.trainerShareNetCents - a.trainerShareNetCents);

    return { totals, trainees, trainers };
  }

  private collectTrainerIds(payments: Payment[]): string[] {
    const set = new Set<string>();
    for (const payment of payments) {
      const trainerId: string | null =
        PaymentSplitAggregationHelper.readTrainerUserId(payment.metadata);
      if (trainerId) {
        set.add(trainerId);
      }
    }
    return Array.from(set);
  }

  private async loadUsersById(ids: string[]): Promise<Map<string, User>> {
    if (ids.length === 0) {
      return new Map<string, User>();
    }
    const users: User[] = await this.em.find(User, { id: { $in: ids } });
    return new Map<string, User>(users.map((u) => [u.id, u]));
  }

  private getOrCreateTotals(
    map: Map<string, AdminEarningsTotalsDto>,
    currency: string,
  ): AdminEarningsTotalsDto {
    const existing: AdminEarningsTotalsDto | undefined = map.get(currency);
    if (existing) {
      return existing;
    }
    const created: AdminEarningsTotalsDto = {
      currency,
      grossPaidCents: 0,
      grossRefundedCents: 0,
      grossNetCents: 0,
      platformFeePaidCents: 0,
      platformFeeRefundedCents: 0,
      platformFeeNetCents: 0,
      trainerSharePaidCents: 0,
      trainerShareRefundedCents: 0,
      trainerShareNetCents: 0,
      isEstimated: false,
    };
    map.set(currency, created);
    return created;
  }

  private getOrCreateTraineeRow(
    map: Map<string, AdminEarningsTraineeRowDto>,
    payment: Payment,
    currency: string,
  ): AdminEarningsTraineeRowDto {
    const traineeId: string = payment.payer.id;
    const key = `${currency}:${traineeId}`;
    const existing: AdminEarningsTraineeRowDto | undefined = map.get(key);
    if (existing) {
      return existing;
    }
    const name = this.formatUserName(payment.payer);
    const created: AdminEarningsTraineeRowDto = {
      traineeId,
      traineeName: name,
      traineeEmail: payment.payer.email ?? '',
      currency,
      paidCount: 0,
      grossPaidCents: 0,
      grossRefundedCents: 0,
      grossNetCents: 0,
    };
    map.set(key, created);
    return created;
  }

  private getOrCreateTrainerRow(
    map: Map<string, AdminEarningsTrainerRowDto>,
    input: {
      readonly trainerId: string;
      readonly trainerUser: User | undefined;
      readonly currency: string;
    },
  ): AdminEarningsTrainerRowDto {
    const key = `${input.currency}:${input.trainerId}`;
    const existing: AdminEarningsTrainerRowDto | undefined = map.get(key);
    if (existing) {
      return existing;
    }
    const name = input.trainerUser
      ? this.formatUserName(input.trainerUser)
      : '';
    const email = input.trainerUser?.email ?? '';
    const created: AdminEarningsTrainerRowDto = {
      trainerId: input.trainerId,
      trainerName: name,
      trainerEmail: email,
      currency: input.currency,
      trainerSharePaidCents: 0,
      trainerShareRefundedCents: 0,
      trainerShareNetCents: 0,
      payout: { statusCounts: {} },
    };
    map.set(key, created);
    return created;
  }

  private formatUserName(user: User): string {
    const firstName: string = user.firstName ?? '';
    const lastName: string = user.lastName ?? '';
    const fullName = `${firstName} ${lastName}`.trim();
    return fullName !== ''
      ? fullName
      : (user.userName ?? user.email ?? user.id);
  }

  private readTrainerPayoutStatus(metadata: unknown): string | null {
    if (!metadata || typeof metadata !== 'object') {
      return null;
    }
    const payout = (metadata as Record<string, unknown>).trainerPayout;
    if (!payout || typeof payout !== 'object') {
      return null;
    }
    const status = (payout as Record<string, unknown>).status;
    return typeof status === 'string' && status.trim() !== '' ? status : null;
  }
}
