import { BadRequestException, Inject, Injectable } from '@nestjs/common';

import { MIN_BOOKING_NOTICE_MINUTES } from '../../../common/constants/time.constant';
import { ERROR_MESSAGES } from '../../../common/constants/message.constant';
import { addMinutesToDate } from '../../../common/helpers/time.helper';
import { utcNowAsDate } from '../../../common/utils/date-time/utc-date-time.helper';
import dayjs from '../../../common/utils/date-time/utc-dayjs';
import { BookingStatus } from '../../../common/enums/booking/booking.enum';
import {
  TrainerApprovalStatus,
  UserRole,
  UserStatus,
} from '../../../common/enums/user/user.enum';

import type { BookingRepository } from '../repositories/booking.repository.interface';
import { BookingRepositoryToken } from '../repositories/booking.repository.interface';

import type { TrainerAvailabilityRepository } from '../../trainer-scheduling/repositories/trainer-availability.repository.interface';
import { TrainerAvailabilityRepositoryToken } from '../../trainer-scheduling/repositories/trainer-availability.repository.interface';

import type { TrainerTimeOffRepository } from '../../trainer-scheduling/repositories/trainer-time-off.repository.interface';
import { TrainerTimeOffRepositoryToken } from '../../trainer-scheduling/repositories/trainer-time-off.repository.interface';

import type { User } from '../../user/entities/user.entity';

export type BookingTimeRange = {
  readonly start: Date;
  readonly end: Date;
};

export type BookingTimeSlot = {
  readonly startTime: string;
  readonly endTime: string;
};

type GetAvailableSlotsInput = {
  readonly trainerId: string;
  readonly rangeStart: Date;
  readonly rangeEnd: Date;
  readonly durationMinutes: number;
  readonly stepMinutes: number;
};

type GetAvailableTrainersForRangeInput = {
  readonly start: Date;
  readonly end: Date;
};

const MIN_DURATION_MINUTES = 60;
const MIN_STEP_MINUTES = 30;
const DATE_LOCAL_FORMAT = 'YYYY-MM-DD';

const toCeilStepDate = (input: { date: Date; stepMinutes: number }): Date => {
  const stepMs = input.stepMinutes * 60 * 1000;
  const ms = dayjs.utc(input.date).valueOf();
  const ceilMs = Math.ceil(ms / stepMs) * stepMs;
  return dayjs.utc(ceilMs).toDate();
};

const isOverlapping = (a: BookingTimeRange, b: BookingTimeRange): boolean => {
  return (
    a.start.getTime() < b.end.getTime() && b.start.getTime() < a.end.getTime()
  );
};

const assertValidSlotQueryInput = (input: GetAvailableSlotsInput): void => {
  if (input.rangeStart >= input.rangeEnd) {
    throw new BadRequestException(ERROR_MESSAGES.BOOKING.INVALID_TIME_RANGE);
  }
  if (input.durationMinutes < MIN_DURATION_MINUTES) {
    throw new BadRequestException(
      ERROR_MESSAGES.TRAINER.AVAILABILITY_MIN_ONE_HOUR,
    );
  }
  if (
    input.stepMinutes < MIN_STEP_MINUTES ||
    input.stepMinutes % MIN_STEP_MINUTES !== 0
  ) {
    throw new BadRequestException('Step minutes must be 30-minute increments');
  }
  if (input.durationMinutes % input.stepMinutes !== 0) {
    throw new BadRequestException(
      'Duration must be a multiple of step minutes',
    );
  }
};

const buildDayjsUtcFromLocalDateAndClockTime = (input: {
  readonly dateLocal: string;
  readonly clockTime: string;
}): dayjs.Dayjs | null => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.dateLocal)) {
    return null;
  }
  if (!/^\d{2}:\d{2}$/.test(input.clockTime)) {
    return null;
  }
  const dt = dayjs.utc(
    `${input.dateLocal} ${input.clockTime}`,
    'YYYY-MM-DD HH:mm',
    true,
  );
  return dt.isValid() ? dt : null;
};

const buildDateLocalsForRollingPeriod = (input: {
  readonly startDateLocal: string;
  readonly period: 'week' | 'month' | 'year';
}): readonly string[] => {
  const start = dayjs
    .utc(input.startDateLocal, DATE_LOCAL_FORMAT, true)
    .startOf('day');
  if (!start.isValid()) return [];
  const endExclusive =
    input.period === 'week'
      ? start.add(7, 'day')
      : input.period === 'month'
        ? start.add(1, 'month')
        : start.add(1, 'year');
  const dayCount = endExclusive.diff(start, 'day');
  if (!Number.isFinite(dayCount) || dayCount <= 0) return [];
  return Array.from({ length: dayCount }).map((_, i) =>
    start.add(i, 'day').format(DATE_LOCAL_FORMAT),
  );
};

@Injectable()
export class BookingAvailabilityService {
  constructor(
    @Inject(TrainerAvailabilityRepositoryToken)
    private readonly availabilityRepo: TrainerAvailabilityRepository,
    @Inject(TrainerTimeOffRepositoryToken)
    private readonly timeOffRepo: TrainerTimeOffRepository,
    @Inject(BookingRepositoryToken)
    private readonly bookingRepo: BookingRepository,
  ) {}

  async assertTrainerCanBeBookedForRange(input: {
    readonly trainerId: string;
    readonly start: Date;
    readonly end: Date;
  }): Promise<void> {
    if (input.start >= input.end) {
      throw new BadRequestException(ERROR_MESSAGES.BOOKING.INVALID_TIME_RANGE);
    }
    const coveringAvailability =
      await this.availabilityRepo.findCoveringForTrainer(
        input.trainerId,
        input.start,
        input.end,
      );
    if (coveringAvailability === null) {
      throw new BadRequestException(
        ERROR_MESSAGES.BOOKING.TIME_SLOT_NOT_AVAILABLE,
      );
    }
    const conflictingTimeOff = await this.timeOffRepo.findOverlappingForTrainer(
      input.trainerId,
      input.start,
      input.end,
    );
    if (conflictingTimeOff !== null) {
      throw new BadRequestException(
        ERROR_MESSAGES.BOOKING.TIME_SLOT_NOT_AVAILABLE,
      );
    }
    const overlapCount = await this.bookingRepo.countOverlapping(
      input.trainerId,
      input.start,
      input.end,
      [BookingStatus.REJECTED, BookingStatus.CANCELLED],
    );
    if (overlapCount > 0) {
      throw new BadRequestException(
        ERROR_MESSAGES.BOOKING.TIME_SLOT_NOT_AVAILABLE,
      );
    }
  }

  async getAvailableTrainersForRange(
    input: GetAvailableTrainersForRangeInput,
  ): Promise<User[]> {
    if (input.start >= input.end) {
      throw new BadRequestException(ERROR_MESSAGES.BOOKING.INVALID_TIME_RANGE);
    }
    const coveringAvailabilities =
      await this.availabilityRepo.findCoveringRanges(input.start, input.end);
    const trainers = coveringAvailabilities
      .map((a) => a.trainer)
      .filter((t): t is User => t != null);
    const uniqueById = new Map<string, User>();
    trainers.forEach((t) => {
      if (!uniqueById.has(t.id)) {
        uniqueById.set(t.id, t);
      }
    });
    const uniqueTrainers = [...uniqueById.values()].filter((t) => {
      const isTrainerRole = t.role === UserRole.TRAINER;
      const isApproved = t.approvalStatus === TrainerApprovalStatus.APPROVED;
      const isActive = t.status === UserStatus.ACTIVE;
      return isTrainerRole && isApproved && isActive;
    });
    const checks = await Promise.all(
      uniqueTrainers.map(async (trainer) => {
        const hasTimeOff =
          (await this.timeOffRepo.findOverlappingForTrainer(
            trainer.id,
            input.start,
            input.end,
          )) !== null;
        if (hasTimeOff) {
          return null;
        }
        const overlapCount = await this.bookingRepo.countOverlapping(
          trainer.id,
          input.start,
          input.end,
          [BookingStatus.REJECTED, BookingStatus.CANCELLED],
        );
        if (overlapCount > 0) {
          return null;
        }
        return trainer;
      }),
    );
    return checks.filter((x): x is User => x !== null);
  }

  async getAvailableTrainersForPeriod(input: {
    readonly startDateLocal: string;
    readonly startClockTime: string;
    readonly endClockTime: string;
    readonly period: 'week' | 'month' | 'year';
  }): Promise<User[]> {
    const dateLocals = buildDateLocalsForRollingPeriod({
      startDateLocal: input.startDateLocal,
      period: input.period,
    });
    if (dateLocals.length === 0) {
      throw new BadRequestException('Invalid start date');
    }
    const first = dateLocals[0];
    const firstStart = buildDayjsUtcFromLocalDateAndClockTime({
      dateLocal: first,
      clockTime: input.startClockTime,
    });
    const firstEnd = buildDayjsUtcFromLocalDateAndClockTime({
      dateLocal: first,
      clockTime: input.endClockTime,
    });
    if (!firstStart || !firstEnd) {
      throw new BadRequestException('Invalid time format');
    }
    if (!firstStart.isBefore(firstEnd)) {
      throw new BadRequestException(ERROR_MESSAGES.BOOKING.INVALID_TIME_RANGE);
    }
    const initial = await this.getAvailableTrainersForRange({
      start: firstStart.toDate(),
      end: firstEnd.toDate(),
    });
    if (initial.length === 0) {
      return [];
    }
    let availableById = new Map<string, User>(initial.map((t) => [t.id, t]));
    for (const dateLocal of dateLocals.slice(1)) {
      if (availableById.size === 0) return [];
      const start = buildDayjsUtcFromLocalDateAndClockTime({
        dateLocal,
        clockTime: input.startClockTime,
      });
      const end = buildDayjsUtcFromLocalDateAndClockTime({
        dateLocal,
        clockTime: input.endClockTime,
      });
      if (!start || !end) {
        throw new BadRequestException('Invalid time format');
      }
      if (!start.isBefore(end)) {
        throw new BadRequestException(
          ERROR_MESSAGES.BOOKING.INVALID_TIME_RANGE,
        );
      }
      const trainersForDay = await this.getAvailableTrainersForRange({
        start: start.toDate(),
        end: end.toDate(),
      });
      const trainerIdsForDay = new Set<string>(trainersForDay.map((t) => t.id));
      availableById = new Map<string, User>(
        [...availableById.values()]
          .filter((t) => trainerIdsForDay.has(t.id))
          .map((t) => [t.id, t]),
      );
    }
    return [...availableById.values()];
  }

  async getAvailableSlots(
    input: GetAvailableSlotsInput,
  ): Promise<BookingTimeSlot[]> {
    assertValidSlotQueryInput(input);
    const earliestAllowed = addMinutesToDate(
      utcNowAsDate(),
      MIN_BOOKING_NOTICE_MINUTES,
    );
    const availabilityRanges =
      await this.availabilityRepo.findOverlappingRangesForTrainer(
        input.trainerId,
        input.rangeStart,
        input.rangeEnd,
      );
    if (availabilityRanges.length === 0) {
      return [];
    }
    const overlappingBookings =
      await this.bookingRepo.findOverlappingForTrainer(
        input.trainerId,
        input.rangeStart,
        input.rangeEnd,
        [BookingStatus.REJECTED, BookingStatus.CANCELLED],
      );
    const timeOffInRange =
      await this.timeOffRepo.findOverlappingRangesForTrainer(
        input.trainerId,
        input.rangeStart,
        input.rangeEnd,
      );
    const blockedRanges: BookingTimeRange[] = [
      ...overlappingBookings.map((b) => ({
        start: dayjs.utc(b.startTime).toDate(),
        end: dayjs.utc(b.endTime).toDate(),
      })),
      ...timeOffInRange.map((t) => ({
        start: dayjs.utc(t.startTime).toDate(),
        end: dayjs.utc(t.endTime).toDate(),
      })),
    ];
    const stepMs = input.stepMinutes * 60 * 1000;
    const durationMs = input.durationMinutes * 60 * 1000;
    const slots: BookingTimeSlot[] = [];
    availabilityRanges.forEach((availability) => {
      const clampedStart = dayjs
        .utc(
          Math.max(
            availability.startTime.getTime(),
            input.rangeStart.getTime(),
            earliestAllowed.getTime(),
          ),
        )
        .toDate();
      const clampedEnd = dayjs
        .utc(Math.min(availability.endTime.getTime(), input.rangeEnd.getTime()))
        .toDate();
      if (clampedEnd.getTime() - clampedStart.getTime() < durationMs) {
        return;
      }
      let cursor = toCeilStepDate({
        date: clampedStart,
        stepMinutes: input.stepMinutes,
      });
      const lastStartMs = clampedEnd.getTime() - durationMs;
      while (cursor.getTime() <= lastStartMs) {
        const start = cursor;
        const end = dayjs.utc(start.getTime() + durationMs).toDate();
        const candidate: BookingTimeRange = { start, end };
        const isBlocked = blockedRanges.some((b) =>
          isOverlapping(candidate, b),
        );
        if (!isBlocked) {
          slots.push({
            startTime: start.toISOString(),
            endTime: end.toISOString(),
          });
        }
        cursor = dayjs.utc(cursor.getTime() + stepMs).toDate();
      }
    });
    const uniqueKey = (s: BookingTimeSlot): string =>
      `${s.startTime}|${s.endTime}`;
    const dedup = new Map<string, BookingTimeSlot>();
    slots.forEach((s) => dedup.set(uniqueKey(s), s));
    return [...dedup.values()].sort(
      (a, b) =>
        dayjs.utc(a.startTime).valueOf() - dayjs.utc(b.startTime).valueOf(),
    );
  }
}
