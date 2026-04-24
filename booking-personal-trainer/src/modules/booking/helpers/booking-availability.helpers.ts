import { BadRequestException } from '@nestjs/common';

import { ERROR_MESSAGES } from '../../../common/constants/message.constant';
import dayjs from '../../../common/utils/date-time/utc-dayjs';

import { BookingTimeRange, BookingTimeSlot } from '../types/booking.type';
import { BookingAvailabilityConstants } from '../constants/booking-availability.constants';

type GetAvailableSlotsInput = {
  readonly trainerId: string;
  readonly rangeStart: Date;
  readonly rangeEnd: Date;
  readonly durationMinutes: number;
  readonly stepMinutes: number;
};

export const toCeilStepDate = (input: {
  readonly date: Date;
  readonly stepMinutes: number;
}): Date => {
  const stepMs = input.stepMinutes * 60 * 1000;
  const ms = dayjs.utc(input.date).valueOf();
  const ceilMs = Math.ceil(ms / stepMs) * stepMs;
  return dayjs.utc(ceilMs).toDate();
};

export const isOverlapping = (
  a: BookingTimeRange,
  b: BookingTimeRange,
): boolean =>
  a.start.getTime() < b.end.getTime() && b.start.getTime() < a.end.getTime();

export const assertValidSlotQueryInput = (
  input: GetAvailableSlotsInput,
): void => {
  if (input.rangeStart >= input.rangeEnd) {
    throw new BadRequestException(ERROR_MESSAGES.BOOKING.INVALID_TIME_RANGE);
  }
  if (
    input.durationMinutes < BookingAvailabilityConstants.MinimumDurationMinutes
  ) {
    throw new BadRequestException(
      ERROR_MESSAGES.TRAINER.AVAILABILITY_MIN_ONE_HOUR,
    );
  }
  if (
    input.stepMinutes < BookingAvailabilityConstants.MinimumStepMinutes ||
    input.stepMinutes % BookingAvailabilityConstants.MinimumStepMinutes !== 0
  ) {
    throw new BadRequestException(
      BookingAvailabilityConstants.StepMinutesMustBeThirtyMinuteIncrement,
    );
  }
  if (input.durationMinutes % input.stepMinutes !== 0) {
    throw new BadRequestException(
      BookingAvailabilityConstants.DurationMustBeMultipleOfStepMinutes,
    );
  }
};

export const buildDayjsUtcFromLocalDateAndClockTime = (input: {
  readonly dateLocal: string;
  readonly clockTime: string;
}): dayjs.Dayjs | null => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.dateLocal)) return null;
  if (!/^\d{2}:\d{2}$/.test(input.clockTime)) return null;
  const dt = dayjs.utc(
    `${input.dateLocal} ${input.clockTime}`,
    'YYYY-MM-DD HH:mm',
    true,
  );
  return dt.isValid() ? dt : null;
};

export const buildDateLocalsForRollingPeriod = (input: {
  readonly startDateLocal: string;
  readonly period: 'week' | 'month' | 'year';
}): readonly string[] => {
  const start = dayjs
    .utc(
      input.startDateLocal,
      BookingAvailabilityConstants.DateLocalFormat,
      true,
    )
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
    start.add(i, 'day').format(BookingAvailabilityConstants.DateLocalFormat),
  );
};

export const buildUniqueTimeSlotKey = (slot: BookingTimeSlot): string =>
  `${slot.startTime}-${slot.endTime}`;
