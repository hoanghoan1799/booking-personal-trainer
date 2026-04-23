import { BadRequestException } from '@nestjs/common';

import {
  assertValidSlotQueryInput,
  buildDateLocalsForRollingPeriod,
  buildDayjsUtcFromLocalDateAndClockTime,
  buildUniqueTimeSlotKey,
  isOverlapping,
  toCeilStepDate,
} from '../booking-availability.helpers';

import { ERROR_MESSAGES } from '../../../../common/constants/message.constant';
import { BookingAvailabilityConstants } from '../../constants/booking-availability.constants';

describe('booking-availability.helpers', () => {
  describe('toCeilStepDate', () => {
    it('should ceil to step minutes', () => {
      const actual = toCeilStepDate({
        date: new Date('2030-01-01T10:10:00.000Z'),
        stepMinutes: 30,
      });

      expect(actual.toISOString()).toBe('2030-01-01T10:30:00.000Z');
    });
  });

  describe('isOverlapping', () => {
    it('should return true when ranges overlap', () => {
      const actual = isOverlapping(
        {
          start: new Date('2030-01-01T10:00:00.000Z'),
          end: new Date('2030-01-01T11:00:00.000Z'),
        },
        {
          start: new Date('2030-01-01T10:30:00.000Z'),
          end: new Date('2030-01-01T11:30:00.000Z'),
        },
      );
      expect(actual).toBe(true);
    });

    it('should return false when touching edges only', () => {
      const actual = isOverlapping(
        {
          start: new Date('2030-01-01T10:00:00.000Z'),
          end: new Date('2030-01-01T11:00:00.000Z'),
        },
        {
          start: new Date('2030-01-01T11:00:00.000Z'),
          end: new Date('2030-01-01T12:00:00.000Z'),
        },
      );
      expect(actual).toBe(false);
    });
  });

  describe('assertValidSlotQueryInput', () => {
    it('should throw when rangeStart >= rangeEnd', () => {
      expect(() =>
        assertValidSlotQueryInput({
          trainerId: 't1',
          rangeStart: new Date('2030-01-01T11:00:00.000Z'),
          rangeEnd: new Date('2030-01-01T10:00:00.000Z'),
          durationMinutes: 60,
          stepMinutes: 30,
        }),
      ).toThrow(ERROR_MESSAGES.BOOKING.INVALID_TIME_RANGE);
    });

    it('should throw when duration is less than minimum', () => {
      expect(() =>
        assertValidSlotQueryInput({
          trainerId: 't1',
          rangeStart: new Date('2030-01-01T10:00:00.000Z'),
          rangeEnd: new Date('2030-01-01T11:00:00.000Z'),
          durationMinutes:
            BookingAvailabilityConstants.MinimumDurationMinutes - 1,
          stepMinutes: BookingAvailabilityConstants.MinimumStepMinutes,
        }),
      ).toThrow(BadRequestException);
    });

    it('should throw when stepMinutes is not a 30-minute increment', () => {
      expect(() =>
        assertValidSlotQueryInput({
          trainerId: 't1',
          rangeStart: new Date('2030-01-01T10:00:00.000Z'),
          rangeEnd: new Date('2030-01-01T12:00:00.000Z'),
          durationMinutes: 60,
          stepMinutes: BookingAvailabilityConstants.MinimumStepMinutes + 1,
        }),
      ).toThrow(
        BookingAvailabilityConstants.StepMinutesMustBeThirtyMinuteIncrement,
      );
    });

    it('should throw when durationMinutes is not a multiple of stepMinutes', () => {
      expect(() =>
        assertValidSlotQueryInput({
          trainerId: 't1',
          rangeStart: new Date('2030-01-01T10:00:00.000Z'),
          rangeEnd: new Date('2030-01-01T12:00:00.000Z'),
          durationMinutes: 90,
          stepMinutes: 60,
        }),
      ).toThrow(
        BookingAvailabilityConstants.DurationMustBeMultipleOfStepMinutes,
      );
    });
  });

  describe('buildDayjsUtcFromLocalDateAndClockTime', () => {
    it('should return null for invalid formats', () => {
      expect(
        buildDayjsUtcFromLocalDateAndClockTime({
          dateLocal: '2030/01/01',
          clockTime: '10:00',
        }),
      ).toBeNull();
      expect(
        buildDayjsUtcFromLocalDateAndClockTime({
          dateLocal: '2030-01-01',
          clockTime: '1000',
        }),
      ).toBeNull();
    });

    it('should return dayjs for valid inputs', () => {
      const actual = buildDayjsUtcFromLocalDateAndClockTime({
        dateLocal: '2030-01-01',
        clockTime: '10:00',
      });

      expect(actual?.toISOString()).toBe('2030-01-01T10:00:00.000Z');
    });
  });

  describe('buildDateLocalsForRollingPeriod', () => {
    it('should return [] for invalid startDateLocal', () => {
      const actual = buildDateLocalsForRollingPeriod({
        startDateLocal: 'invalid',
        period: 'week',
      });
      expect(actual).toEqual([]);
    });

    it('should return correct day count for week', () => {
      const actual = buildDateLocalsForRollingPeriod({
        startDateLocal: '2030-01-01',
        period: 'week',
      });
      expect(actual.length).toBe(7);
      expect(actual[0]).toBe('2030-01-01');
      expect(actual[6]).toBe('2030-01-07');
    });
  });

  describe('buildUniqueTimeSlotKey', () => {
    it('should build key from start and end times', () => {
      const actual = buildUniqueTimeSlotKey({
        startTime: '2030-01-01T10:00:00.000Z',
        endTime: '2030-01-01T11:00:00.000Z',
      });
      expect(actual).toBe('2030-01-01T10:00:00.000Z-2030-01-01T11:00:00.000Z');
    });
  });
});
