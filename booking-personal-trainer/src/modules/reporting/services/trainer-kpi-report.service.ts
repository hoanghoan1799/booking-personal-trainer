import { Injectable } from '@nestjs/common';
import { EntityManager, FilterQuery } from '@mikro-orm/core';

import { BookingStatus } from '../../../common/enums/booking/booking.enum';
import { PaymentStatus } from '../../../common/enums/billing/billing.enum';
import { WorkoutStatus } from '../../../common/enums/workout/workout.enum';

import { Booking } from '../../booking/entities/booking.entity';
import { PaymentSplitAggregationHelper } from '../../payments/helpers/payment-split-aggregation.helper';
import { Payment } from '../../payments/entities/payment.entity';
import { User } from '../../user/entities/user.entity';
import { Workout } from '../../workout/entities/workout.entity';
import { TrainerKpiQueryDto } from '../dtos/trainer-kpi-query.dto';
import { TrainerKpiRowDto } from '../dtos/trainer-kpi-row.dto';

const MILLISECONDS_PER_MINUTE = 60_000;

type MutableTrainerKpi = {
  trainerId: string;
  confirmedBookingsCount: number;
  cancelledBookingsCount: number;
  rejectedBookingsCount: number;
  workoutsDoneCount: number;
  deliveredMilliseconds: number;
  trainerShareNetCents: number;
};

@Injectable()
export class TrainerKpiReportService {
  constructor(private readonly em: EntityManager) {}

  /**
   * Builds trainer KPI rows for a date range (booking/workout startTime; payment paid/refunded timestamps).
   */
  public async getTrainerKpiRows(input: {
    readonly query: TrainerKpiQueryDto;
    readonly trainerUserIdFilter: string | null;
  }): Promise<TrainerKpiRowDto[]> {
    const limit: number = input.query.limit ?? 50;
    const revenueCurrency: string =
      input.query.currency != null && input.query.currency.trim() !== ''
        ? input.query.currency.trim().toUpperCase()
        : 'USD';
    const startTimeFilter: { $gte?: Date; $lt?: Date } | undefined =
      this.buildStartTimeRange({
        from: input.query.from,
        to: input.query.to,
      });
    const bookingWhere: FilterQuery<Booking> = {};
    if (startTimeFilter) {
      bookingWhere.startTime = startTimeFilter;
    }
    if (input.trainerUserIdFilter != null) {
      bookingWhere.trainer = input.trainerUserIdFilter;
    }
    const workoutWhere: FilterQuery<Workout> = {
      isDeleted: { $ne: true },
    };
    if (startTimeFilter) {
      workoutWhere.startTime = startTimeFilter;
    }
    if (input.trainerUserIdFilter != null) {
      workoutWhere.trainer = input.trainerUserIdFilter;
    }
    const paymentWhere: FilterQuery<Payment> =
      PaymentSplitAggregationHelper.buildPaidRefundedDateFilter({
        from: input.query.from,
        to: input.query.to,
        currency: revenueCurrency,
      });
    const [bookings, workouts, payments]: [Booking[], Workout[], Payment[]] =
      await Promise.all([
        this.em.find(Booking, bookingWhere, { populate: ['trainer'] }),
        this.em.find(Workout, workoutWhere, { populate: ['trainer'] }),
        this.em.find(Payment, paymentWhere),
      ]);
    const kpiByTrainerId = new Map<string, MutableTrainerKpi>();
    const ensureRow = (trainerId: string): MutableTrainerKpi => {
      const found: MutableTrainerKpi | undefined =
        kpiByTrainerId.get(trainerId);
      if (found) {
        return found;
      }
      const created: MutableTrainerKpi = {
        trainerId,
        confirmedBookingsCount: 0,
        cancelledBookingsCount: 0,
        rejectedBookingsCount: 0,
        workoutsDoneCount: 0,
        deliveredMilliseconds: 0,
        trainerShareNetCents: 0,
      };
      kpiByTrainerId.set(trainerId, created);
      return created;
    };
    for (const booking of bookings) {
      const row: MutableTrainerKpi = ensureRow(booking.trainer.id);
      if (booking.status === BookingStatus.CONFIRMED) {
        row.confirmedBookingsCount += 1;
      } else if (booking.status === BookingStatus.CANCELLED) {
        row.cancelledBookingsCount += 1;
      } else if (booking.status === BookingStatus.REJECTED) {
        row.rejectedBookingsCount += 1;
      }
    }
    for (const workout of workouts) {
      if (workout.status !== WorkoutStatus.DONE) {
        continue;
      }
      const row: MutableTrainerKpi = ensureRow(workout.trainer.id);
      row.workoutsDoneCount += 1;
      const durationMs: number =
        workout.endTime.getTime() - workout.startTime.getTime();
      if (durationMs > 0) {
        row.deliveredMilliseconds += durationMs;
      }
    }
    for (const payment of payments) {
      const trainerId: string | null =
        PaymentSplitAggregationHelper.readTrainerUserId(payment.metadata);
      if (!trainerId) {
        continue;
      }
      if (
        input.trainerUserIdFilter != null &&
        trainerId !== input.trainerUserIdFilter
      ) {
        continue;
      }
      if ((payment.currency ?? 'USD').toUpperCase() !== revenueCurrency) {
        continue;
      }
      const isPaid: boolean = payment.status === PaymentStatus.PAID;
      const isRefunded: boolean = payment.status === PaymentStatus.REFUNDED;
      if (!isPaid && !isRefunded) {
        continue;
      }
      const { trainerShareCents } =
        PaymentSplitAggregationHelper.readOrEstimateSplit({
          payment,
        });
      const sign: number = isPaid ? 1 : -1;
      const row: MutableTrainerKpi = ensureRow(trainerId);
      row.trainerShareNetCents += sign * trainerShareCents;
    }
    const trainerIds: string[] = Array.from(kpiByTrainerId.keys());
    const trainers: User[] =
      trainerIds.length === 0
        ? []
        : await this.em.find(User, { id: { $in: trainerIds } });
    const trainerById = new Map<string, User>(trainers.map((u) => [u.id, u]));
    const rows: TrainerKpiRowDto[] = trainerIds.map((trainerId: string) => {
      const kpi: MutableTrainerKpi = kpiByTrainerId.get(trainerId)!;
      const user: User | undefined = trainerById.get(trainerId);
      return {
        trainerId,
        trainerName: user ? this.formatUserName(user) : '',
        trainerEmail: user?.email ?? '',
        confirmedBookingsCount: kpi.confirmedBookingsCount,
        cancelledBookingsCount: kpi.cancelledBookingsCount,
        rejectedBookingsCount: kpi.rejectedBookingsCount,
        workoutsDoneCount: kpi.workoutsDoneCount,
        deliveredMinutes: Math.floor(
          kpi.deliveredMilliseconds / MILLISECONDS_PER_MINUTE,
        ),
        trainerShareNetCents: kpi.trainerShareNetCents,
      };
    });
    rows.sort((a, b) => {
      if (b.trainerShareNetCents !== a.trainerShareNetCents) {
        return b.trainerShareNetCents - a.trainerShareNetCents;
      }
      return a.trainerName.localeCompare(b.trainerName);
    });
    if (input.trainerUserIdFilter != null) {
      return rows;
    }
    return rows.slice(0, limit);
  }

  private buildStartTimeRange(input: {
    readonly from?: Date;
    readonly to?: Date;
  }): { $gte?: Date; $lt?: Date } | undefined {
    if (!input.from && !input.to) {
      return undefined;
    }
    const range: { $gte?: Date; $lt?: Date } = {};
    if (input.from) {
      range.$gte = input.from;
    }
    if (input.to) {
      range.$lt = input.to;
    }
    return range;
  }

  private formatUserName(user: User): string {
    const firstName: string = user.firstName ?? '';
    const lastName: string = user.lastName ?? '';
    const fullName: string = `${firstName} ${lastName}`.trim();
    return fullName !== ''
      ? fullName
      : (user.userName ?? user.email ?? user.id);
  }
}
