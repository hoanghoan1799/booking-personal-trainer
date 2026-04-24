import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';

// Commons
import { ERROR_MESSAGES } from '../../../../common/constants/message.constant';
import { BookingStatus } from '../../../../common/enums/booking/booking.enum';
import {
  TrainerApprovalStatus,
  UserRole,
  UserStatus,
} from '../../../../common/enums/user/user.enum';

// Entities
import type { User } from '../../../user/entities/user.entity';

// Services
import { BookingAvailabilityService } from '../booking-availability.service';
import { TrainerAvailabilityService } from '../../../trainer-scheduling/services/trainer-availability.service';
import { TrainerTimeOffService } from '../../../trainer-scheduling/services/trainer-time-off.service';

// Repositories
import { BookingRepositoryToken } from '../../repositories/booking.repository.interface';

const TRAINER_ID = 'trainer-id';
const RANGE_START = new Date('2030-01-01T10:00:00.000Z');
const RANGE_END = new Date('2030-01-01T11:00:00.000Z');

const buildUser = (input: {
  readonly id: string;
  readonly role: UserRole;
  readonly approvalStatus: TrainerApprovalStatus;
  readonly status: UserStatus;
}): User =>
  ({
    id: input.id,
    role: input.role,
    approvalStatus: input.approvalStatus,
    status: input.status,
  }) as User;

describe('BookingAvailabilityService', () => {
  let service: BookingAvailabilityService;
  let trainerAvailabilityService: {
    getCoveringAvailabilityForTrainer: jest.Mock;
    getCoveringAvailabilitiesForRange: jest.Mock;
    getOverlappingAvailabilityRangesForTrainer: jest.Mock;
  };
  let trainerTimeOffService: {
    getOverlappingTimeOffForTrainer: jest.Mock;
    getOverlappingTimeOffRangesForTrainer: jest.Mock;
  };
  let bookingRepo: {
    countOverlapping: jest.Mock;
    findOverlappingForTrainer: jest.Mock;
  };

  beforeEach(async () => {
    trainerAvailabilityService = {
      getCoveringAvailabilityForTrainer: jest.fn(),
      getCoveringAvailabilitiesForRange: jest.fn(),
      getOverlappingAvailabilityRangesForTrainer: jest.fn(),
    };
    trainerTimeOffService = {
      getOverlappingTimeOffForTrainer: jest.fn(),
      getOverlappingTimeOffRangesForTrainer: jest.fn(),
    };
    bookingRepo = {
      countOverlapping: jest.fn(),
      findOverlappingForTrainer: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingAvailabilityService,
        {
          provide: TrainerAvailabilityService,
          useValue: trainerAvailabilityService,
        },
        {
          provide: TrainerTimeOffService,
          useValue: trainerTimeOffService,
        },
        {
          provide: BookingRepositoryToken,
          useValue: bookingRepo,
        },
      ],
    }).compile();

    service = module.get<BookingAvailabilityService>(
      BookingAvailabilityService,
    );
  });

  describe('assertTrainerCanBeBookedForRange', () => {
    it('should throw when start >= end', async () => {
      await expect(
        service.assertTrainerCanBeBookedForRange({
          trainerId: TRAINER_ID,
          start: RANGE_END,
          end: RANGE_START,
        }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.assertTrainerCanBeBookedForRange({
          trainerId: TRAINER_ID,
          start: RANGE_END,
          end: RANGE_START,
        }),
      ).rejects.toThrow(ERROR_MESSAGES.BOOKING.INVALID_TIME_RANGE);
    });

    it('should throw when no covering availability', async () => {
      trainerAvailabilityService.getCoveringAvailabilityForTrainer.mockResolvedValue(
        null,
      );

      await expect(
        service.assertTrainerCanBeBookedForRange({
          trainerId: TRAINER_ID,
          start: RANGE_START,
          end: RANGE_END,
        }),
      ).rejects.toThrow(ERROR_MESSAGES.BOOKING.TIME_SLOT_NOT_AVAILABLE);
    });

    it('should throw when conflicting time off exists', async () => {
      trainerAvailabilityService.getCoveringAvailabilityForTrainer.mockResolvedValue(
        {},
      );
      trainerTimeOffService.getOverlappingTimeOffForTrainer.mockResolvedValue({
        id: 'timeoff',
      });

      await expect(
        service.assertTrainerCanBeBookedForRange({
          trainerId: TRAINER_ID,
          start: RANGE_START,
          end: RANGE_END,
        }),
      ).rejects.toThrow(ERROR_MESSAGES.BOOKING.TIME_SLOT_NOT_AVAILABLE);
    });

    it('should throw when overlapping bookings exist', async () => {
      trainerAvailabilityService.getCoveringAvailabilityForTrainer.mockResolvedValue(
        {},
      );
      trainerTimeOffService.getOverlappingTimeOffForTrainer.mockResolvedValue(
        null,
      );
      bookingRepo.countOverlapping.mockResolvedValue(1);

      await expect(
        service.assertTrainerCanBeBookedForRange({
          trainerId: TRAINER_ID,
          start: RANGE_START,
          end: RANGE_END,
        }),
      ).rejects.toThrow(ERROR_MESSAGES.BOOKING.TIME_SLOT_NOT_AVAILABLE);
    });

    it('should not throw when availability covers and no conflicts', async () => {
      trainerAvailabilityService.getCoveringAvailabilityForTrainer.mockResolvedValue(
        {},
      );
      trainerTimeOffService.getOverlappingTimeOffForTrainer.mockResolvedValue(
        null,
      );
      bookingRepo.countOverlapping.mockResolvedValue(0);

      await expect(
        service.assertTrainerCanBeBookedForRange({
          trainerId: TRAINER_ID,
          start: RANGE_START,
          end: RANGE_END,
        }),
      ).resolves.toBeUndefined();
    });
  });

  describe('getAvailableTrainersForRange', () => {
    it('should throw when start >= end', async () => {
      await expect(
        service.getAvailableTrainersForRange({
          start: RANGE_END,
          end: RANGE_START,
        }),
      ).rejects.toThrow(ERROR_MESSAGES.BOOKING.INVALID_TIME_RANGE);
    });

    it('should filter trainers by role/approval/status, and remove conflicts', async () => {
      const okTrainer = buildUser({
        id: 'trainer-ok',
        role: UserRole.TRAINER,
        approvalStatus: TrainerApprovalStatus.APPROVED,
        status: UserStatus.ACTIVE,
      });
      const inactiveTrainer = buildUser({
        id: 'trainer-inactive',
        role: UserRole.TRAINER,
        approvalStatus: TrainerApprovalStatus.APPROVED,
        status: UserStatus.INACTIVE,
      });
      const notTrainerRole = buildUser({
        id: 'not-trainer',
        role: UserRole.TRAINEE,
        approvalStatus: TrainerApprovalStatus.APPROVED,
        status: UserStatus.ACTIVE,
      });
      const notApprovedTrainer = buildUser({
        id: 'not-approved',
        role: UserRole.TRAINER,
        approvalStatus: TrainerApprovalStatus.PENDING,
        status: UserStatus.ACTIVE,
      });
      trainerAvailabilityService.getCoveringAvailabilitiesForRange.mockResolvedValue(
        [
          { trainer: okTrainer },
          { trainer: okTrainer },
          { trainer: inactiveTrainer },
          { trainer: notTrainerRole },
          { trainer: notApprovedTrainer },
        ],
      );
      trainerTimeOffService.getOverlappingTimeOffForTrainer.mockImplementation(
        (trainerId: string) =>
          trainerId === okTrainer.id ? null : { id: 'timeoff' },
      );
      bookingRepo.countOverlapping.mockResolvedValue(0);

      const actual = await service.getAvailableTrainersForRange({
        start: RANGE_START,
        end: RANGE_END,
      });

      expect(actual).toEqual([okTrainer]);
      expect(bookingRepo.countOverlapping).toHaveBeenCalledWith(
        okTrainer.id,
        RANGE_START,
        RANGE_END,
        [BookingStatus.REJECTED, BookingStatus.CANCELLED],
      );
    });

    it('should exclude trainer when overlapping bookings exist', async () => {
      const okTrainer = buildUser({
        id: 'trainer-ok',
        role: UserRole.TRAINER,
        approvalStatus: TrainerApprovalStatus.APPROVED,
        status: UserStatus.ACTIVE,
      });
      trainerAvailabilityService.getCoveringAvailabilitiesForRange.mockResolvedValue(
        [{ trainer: okTrainer }],
      );
      trainerTimeOffService.getOverlappingTimeOffForTrainer.mockResolvedValue(
        null,
      );
      bookingRepo.countOverlapping.mockResolvedValue(2);

      const actual = await service.getAvailableTrainersForRange({
        start: RANGE_START,
        end: RANGE_END,
      });

      expect(actual).toEqual([]);
    });

    it('should exclude trainer when time off overlaps', async () => {
      const okTrainer = buildUser({
        id: 'trainer-ok',
        role: UserRole.TRAINER,
        approvalStatus: TrainerApprovalStatus.APPROVED,
        status: UserStatus.ACTIVE,
      });
      trainerAvailabilityService.getCoveringAvailabilitiesForRange.mockResolvedValue(
        [{ trainer: okTrainer }],
      );
      trainerTimeOffService.getOverlappingTimeOffForTrainer.mockResolvedValue({
        id: 'timeoff',
      });

      const actual = await service.getAvailableTrainersForRange({
        start: RANGE_START,
        end: RANGE_END,
      });

      expect(actual).toEqual([]);
    });
  });

  describe('getAvailableTrainersForPeriod', () => {
    it('should throw when startDateLocal is invalid', async () => {
      await expect(
        service.getAvailableTrainersForPeriod({
          startDateLocal: 'invalid',
          startClockTime: '10:00',
          endClockTime: '11:00',
          period: 'week',
        }),
      ).rejects.toThrow('Invalid start date');
    });

    it('should return [] when initial day has no available trainers', async () => {
      trainerAvailabilityService.getCoveringAvailabilitiesForRange.mockResolvedValue(
        [],
      );

      const actual = await service.getAvailableTrainersForPeriod({
        startDateLocal: '2030-01-01',
        startClockTime: '10:00',
        endClockTime: '11:00',
        period: 'week',
      });

      expect(actual).toEqual([]);
    });

    it('should throw when first day time format is invalid', async () => {
      await expect(
        service.getAvailableTrainersForPeriod({
          startDateLocal: '2030-01-01',
          startClockTime: 'invalid',
          endClockTime: '11:00',
          period: 'week',
        }),
      ).rejects.toThrow(ERROR_MESSAGES.DATE.INVALID_DATE_FORMAT);
    });

    it('should throw when first day start is not before end', async () => {
      await expect(
        service.getAvailableTrainersForPeriod({
          startDateLocal: '2030-01-01',
          startClockTime: '11:00',
          endClockTime: '10:00',
          period: 'week',
        }),
      ).rejects.toThrow(ERROR_MESSAGES.BOOKING.INVALID_TIME_RANGE);
    });

    it('should intersect availability across days', async () => {
      const a = buildUser({
        id: 'a',
        role: UserRole.TRAINER,
        approvalStatus: TrainerApprovalStatus.APPROVED,
        status: UserStatus.ACTIVE,
      });
      const b = buildUser({
        id: 'b',
        role: UserRole.TRAINER,
        approvalStatus: TrainerApprovalStatus.APPROVED,
        status: UserStatus.ACTIVE,
      });
      trainerAvailabilityService.getCoveringAvailabilitiesForRange
        .mockResolvedValueOnce([{ trainer: a }, { trainer: b }])
        .mockResolvedValueOnce([{ trainer: b }])
        .mockResolvedValue([{ trainer: b }]);
      trainerTimeOffService.getOverlappingTimeOffForTrainer.mockResolvedValue(
        null,
      );
      bookingRepo.countOverlapping.mockResolvedValue(0);

      const actual = await service.getAvailableTrainersForPeriod({
        startDateLocal: '2030-01-01',
        startClockTime: '10:00',
        endClockTime: '11:00',
        period: 'week',
      });

      expect(actual).toEqual([b]);
    });
  });

  describe('getAvailableSlots', () => {
    it('should throw when input is invalid', async () => {
      await expect(
        service.getAvailableSlots({
          trainerId: TRAINER_ID,
          rangeStart: RANGE_END,
          rangeEnd: RANGE_START,
          durationMinutes: 60,
          stepMinutes: 30,
        }),
      ).rejects.toThrow(ERROR_MESSAGES.BOOKING.INVALID_TIME_RANGE);
    });

    it('should return [] when trainer has no availability ranges', async () => {
      trainerAvailabilityService.getOverlappingAvailabilityRangesForTrainer.mockResolvedValue(
        [],
      );

      const actual = await service.getAvailableSlots({
        trainerId: TRAINER_ID,
        rangeStart: RANGE_START,
        rangeEnd: RANGE_END,
        durationMinutes: 60,
        stepMinutes: 30,
      });

      expect(actual).toEqual([]);
    });

    it('should return available slot and dedupe overlaps', async () => {
      const availability: { readonly startTime: Date; readonly endTime: Date } =
        {
          startTime: new Date('2030-01-01T10:00:00.000Z'),
          endTime: new Date('2030-01-01T12:00:00.000Z'),
        };
      trainerAvailabilityService.getOverlappingAvailabilityRangesForTrainer.mockResolvedValue(
        [availability],
      );
      bookingRepo.findOverlappingForTrainer.mockResolvedValue([
        {
          startTime: new Date('2030-01-01T11:00:00.000Z'),
          endTime: new Date('2030-01-01T12:00:00.000Z'),
        },
      ]);
      trainerTimeOffService.getOverlappingTimeOffRangesForTrainer.mockResolvedValue(
        [],
      );

      const actual = await service.getAvailableSlots({
        trainerId: TRAINER_ID,
        rangeStart: new Date('2030-01-01T10:00:00.000Z'),
        rangeEnd: new Date('2030-01-01T12:00:00.000Z'),
        durationMinutes: 60,
        stepMinutes: 30,
      });

      expect(actual.length).toBe(1);
      expect(actual[0]?.startTime).toBe('2030-01-01T10:00:00.000Z');
      expect(actual[0]?.endTime).toBe('2030-01-01T11:00:00.000Z');
    });

    it('should skip availability window when shorter than duration', async () => {
      trainerAvailabilityService.getOverlappingAvailabilityRangesForTrainer.mockResolvedValue(
        [
          {
            startTime: new Date('2030-01-01T10:00:00.000Z'),
            endTime: new Date('2030-01-01T10:30:00.000Z'),
          },
        ],
      );
      bookingRepo.findOverlappingForTrainer.mockResolvedValue([]);
      trainerTimeOffService.getOverlappingTimeOffRangesForTrainer.mockResolvedValue(
        [],
      );

      const actual = await service.getAvailableSlots({
        trainerId: TRAINER_ID,
        rangeStart: new Date('2030-01-01T10:00:00.000Z'),
        rangeEnd: new Date('2030-01-01T10:30:00.000Z'),
        durationMinutes: 60,
        stepMinutes: 30,
      });

      expect(actual).toEqual([]);
    });

    it('should block slots that overlap time off and return sorted slots', async () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2030-01-01T00:00:00.000Z'));
      trainerAvailabilityService.getOverlappingAvailabilityRangesForTrainer.mockResolvedValue(
        [
          {
            startTime: new Date('2030-01-01T10:00:00.000Z'),
            endTime: new Date('2030-01-01T12:00:00.000Z'),
          },
        ],
      );
      bookingRepo.findOverlappingForTrainer.mockResolvedValue([]);
      trainerTimeOffService.getOverlappingTimeOffRangesForTrainer.mockResolvedValue(
        [
          {
            startTime: new Date('2030-01-01T10:00:00.000Z'),
            endTime: new Date('2030-01-01T11:00:00.000Z'),
          },
        ],
      );

      const actual = await service.getAvailableSlots({
        trainerId: TRAINER_ID,
        rangeStart: new Date('2030-01-01T10:00:00.000Z'),
        rangeEnd: new Date('2030-01-01T12:00:00.000Z'),
        durationMinutes: 60,
        stepMinutes: 30,
      });

      expect(actual.map((s) => s.startTime)).toEqual([
        '2030-01-01T11:00:00.000Z',
      ]);
      jest.useRealTimers();
    });
  });
});
