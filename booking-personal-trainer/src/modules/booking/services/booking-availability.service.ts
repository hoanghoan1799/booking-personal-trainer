import { BadRequestException, Inject, Injectable } from '@nestjs/common';

import { MIN_BOOKING_NOTICE_MINUTES } from '../../../common/constants/time.constant';
import { ERROR_MESSAGES } from '../../../common/constants/message.constant';
import { addMinutesToDate } from '../../../common/helpers/time.helper';
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

const toCeilStepDate = (input: { date: Date; stepMinutes: number }): Date => {
  const stepMs = input.stepMinutes * 60 * 1000;
  const ms = input.date.getTime();
  const ceilMs = Math.ceil(ms / stepMs) * stepMs;
  return new Date(ceilMs);
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
      BookingStatus.REJECTED,
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
          BookingStatus.REJECTED,
        );
        if (overlapCount > 0) {
          return null;
        }
        return trainer;
      }),
    );
    return checks.filter((x): x is User => x !== null);
  }

  async getAvailableSlots(
    input: GetAvailableSlotsInput,
  ): Promise<BookingTimeSlot[]> {
    assertValidSlotQueryInput(input);
    const earliestAllowed = addMinutesToDate(
      new Date(),
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
        BookingStatus.REJECTED,
      );
    const timeOffInRange =
      await this.timeOffRepo.findOverlappingRangesForTrainer(
        input.trainerId,
        input.rangeStart,
        input.rangeEnd,
      );
    const blockedRanges: BookingTimeRange[] = [
      ...overlappingBookings.map((b) => ({
        start: new Date(b.startTime),
        end: new Date(b.endTime),
      })),
      ...timeOffInRange.map((t) => ({
        start: new Date(t.startTime),
        end: new Date(t.endTime),
      })),
    ];
    const stepMs = input.stepMinutes * 60 * 1000;
    const durationMs = input.durationMinutes * 60 * 1000;
    const slots: BookingTimeSlot[] = [];
    availabilityRanges.forEach((availability) => {
      const clampedStart = new Date(
        Math.max(
          availability.startTime.getTime(),
          input.rangeStart.getTime(),
          earliestAllowed.getTime(),
        ),
      );
      const clampedEnd = new Date(
        Math.min(availability.endTime.getTime(), input.rangeEnd.getTime()),
      );
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
        const end = new Date(start.getTime() + durationMs);
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
        cursor = new Date(cursor.getTime() + stepMs);
      }
    });
    const uniqueKey = (s: BookingTimeSlot): string =>
      `${s.startTime}|${s.endTime}`;
    const dedup = new Map<string, BookingTimeSlot>();
    slots.forEach((s) => dedup.set(uniqueKey(s), s));
    return [...dedup.values()].sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
    );
  }
}
