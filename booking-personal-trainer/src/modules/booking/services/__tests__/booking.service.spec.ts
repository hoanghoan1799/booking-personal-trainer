import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';

// Commons
import { UserRole } from '../../../../common/enums/user/user.enum';
import { BookingStatus } from '../../../../common/enums/booking/booking.enum';
import { SortOrder } from '../../../../common/enums/pagination/pagination.enum';
import { ERROR_MESSAGES } from '../../../../common/constants/message.constant';

// Entities
import { Booking } from '../../entities/booking.entity';
import { User } from '../../../user/entities/user.entity';

// Services
import { BookingService } from '../booking.service';
import { BookingAvailabilityService } from '../booking-availability.service';
import { NotificationsService } from '../../../notifications/services/notifications.service';
import { EmailService } from '../../../email/services/email.service';

// Repositories
import { BookingRepositoryToken } from '../../repositories/booking.repository.interface';
import { UserService } from '../../../user/services/user.service';
import { EntityManager } from '@mikro-orm/core';
import { BookingSeries } from '../../entities/booking-series.entity';
import { CreateBookingsBulkDto } from '../../dtos/create-bookings-bulk.dto';

type TransactionalEntityManagerMock = {
  readonly create: jest.Mock;
  readonly persist: jest.Mock;
  readonly flush: jest.Mock;
};

type TransactionalHandler<T> = (
  em: TransactionalEntityManagerMock,
) => Promise<T>;

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const PAGE_TWO = 2;
const LIMIT_FIVE = 5;
const TOTAL_ITEMS_ONE = 1;
const TOTAL_PAGES_ONE = 1;
const NO_OVERLAP_COUNT = 0;
const HOURS_FUTURE_START = 2;
const HOURS_PAST_OFFSET = -2;
const HOURS_DURATION = 1;
const FIXED_NOW = new Date('2030-01-01T00:00:00.000Z');

describe('BookingService', () => {
  let service: BookingService;
  let bookingRepo: {
    countOverlapping: jest.Mock;
    create: jest.Mock;
    findById: jest.Mock;
    findAndCount: jest.Mock;
    findTraineeIdsByTrainerId: jest.Mock;
    save: jest.Mock;
  };
  let userService: {
    findByIdOrNull: jest.Mock;
    getAdminEmailAddresses: jest.Mock;
  };
  let bookingAvailabilityService: {
    assertTrainerCanBeBookedForRange: jest.Mock;
  };
  let notificationsService: {
    notifyAdmins: jest.Mock;
    createAndPublishToUsers: jest.Mock;
  };
  let emailService: { send: jest.Mock };
  let em: {
    transactional: jest.Mock;
  };

  const mockTrainee: User = {
    id: 'trainee-uuid',
    email: 'trainee@test.com',
    userName: 'trainee',
    role: UserRole.TRAINEE,
  } as User;

  const mockTrainer: User = {
    id: 'trainer-uuid',
    email: 'trainer@test.com',
    userName: 'trainer',
    role: UserRole.TRAINER,
  } as User;

  const createValidFutureDates = (): { startTime: string; endTime: string } => {
    const start = new Date();
    start.setHours(start.getHours() + HOURS_FUTURE_START, 0, 0, 0);
    const end = new Date(start);
    end.setHours(end.getHours() + HOURS_DURATION, 0, 0, 0);
    return {
      startTime: start.toISOString(),
      endTime: end.toISOString(),
    };
  };

  beforeEach(async () => {
    jest.useFakeTimers();
    jest.setSystemTime(FIXED_NOW);
    bookingRepo = {
      countOverlapping: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
      findAndCount: jest.fn(),
      findTraineeIdsByTrainerId: jest.fn(),
      save: jest.fn().mockResolvedValue(undefined),
    };
    userService = {
      findByIdOrNull: jest.fn(),
      getAdminEmailAddresses: jest.fn().mockResolvedValue([]),
    };
    bookingAvailabilityService = {
      assertTrainerCanBeBookedForRange: jest.fn().mockResolvedValue(undefined),
    };
    notificationsService = {
      notifyAdmins: jest.fn().mockResolvedValue(undefined),
      createAndPublishToUsers: jest.fn().mockResolvedValue([]),
    };
    emailService = {
      send: jest.fn().mockResolvedValue({ messageId: 'mock-message-id' }),
    };
    em = {
      transactional: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingService,
        {
          provide: BookingRepositoryToken,
          useValue: bookingRepo,
        },
        {
          provide: UserService,
          useValue: userService,
        },
        {
          provide: BookingAvailabilityService,
          useValue: bookingAvailabilityService,
        },
        {
          provide: NotificationsService,
          useValue: notificationsService,
        },
        {
          provide: EmailService,
          useValue: emailService,
        },
        {
          provide: EntityManager,
          useValue: em,
        },
      ],
    }).compile();

    service = module.get<BookingService>(BookingService);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('create', () => {
    it('should throw BadRequestException when time range is invalid format', async () => {
      await expect(
        service.create(
          {
            trainerId: mockTrainer.id,
            startTime: 'not-a-date',
            endTime: 'not-a-date',
          },
          mockTrainee,
        ),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.create(
          {
            trainerId: mockTrainer.id,
            startTime: 'not-a-date',
            endTime: 'not-a-date',
          },
          mockTrainee,
        ),
      ).rejects.toThrow(ERROR_MESSAGES.BOOKING.INVALID_TIME_RANGE);
    });

    it('should throw BadRequestException when start >= end', async () => {
      const { startTime, endTime } = createValidFutureDates();
      const data = {
        trainerId: mockTrainer.id,
        startTime: endTime,
        endTime: startTime,
      };

      await expect(service.create(data, mockTrainee)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(data, mockTrainee)).rejects.toThrow(
        ERROR_MESSAGES.BOOKING.INVALID_TIME_RANGE,
      );
    });

    it('should throw BadRequestException when booking in the past', async () => {
      const past = new Date();
      past.setHours(past.getHours() + HOURS_PAST_OFFSET, 0, 0, 0);
      const end = new Date(past);
      end.setHours(end.getHours() + HOURS_DURATION, 0, 0, 0);
      const data = {
        trainerId: mockTrainer.id,
        startTime: past.toISOString(),
        endTime: end.toISOString(),
      };

      await expect(service.create(data, mockTrainee)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(data, mockTrainee)).rejects.toThrow(
        ERROR_MESSAGES.BOOKING.CANNOT_BOOK_IN_PAST,
      );
    });

    it('should throw BadRequestException when booking is less than 30 minutes from now', async () => {
      const start = new Date(FIXED_NOW.getTime() + 10 * 60 * 1000);
      const end = new Date(FIXED_NOW.getTime() + 70 * 60 * 1000);
      userService.findByIdOrNull.mockResolvedValue(mockTrainer);

      await expect(
        service.create(
          {
            trainerId: mockTrainer.id,
            startTime: start.toISOString(),
            endTime: end.toISOString(),
          },
          mockTrainee,
        ),
      ).rejects.toThrow(ERROR_MESSAGES.BOOKING.MUST_BOOK_BEFORE_30_MINUTES);
    });

    it('should throw NotFoundException when trainer not found', async () => {
      const { startTime, endTime } = createValidFutureDates();
      userService.findByIdOrNull.mockResolvedValue(null);

      await expect(
        service.create(
          { trainerId: mockTrainer.id, startTime, endTime },
          mockTrainee,
        ),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.create(
          { trainerId: mockTrainer.id, startTime, endTime },
          mockTrainee,
        ),
      ).rejects.toThrow(ERROR_MESSAGES.USER.TRAINER_NOT_AVAILABLE);
    });

    it('should throw BadRequestException when trainee books self', async () => {
      const { startTime, endTime } = createValidFutureDates();
      userService.findByIdOrNull.mockResolvedValue(mockTrainee);

      await expect(
        service.create(
          { trainerId: mockTrainee.id, startTime, endTime },
          mockTrainee,
        ),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.create(
          { trainerId: mockTrainee.id, startTime, endTime },
          mockTrainee,
        ),
      ).rejects.toThrow(ERROR_MESSAGES.BOOKING.CANNOT_BOOK_SELF);
    });

    it('should throw BadRequestException when time slot overlaps', async () => {
      const { startTime, endTime } = createValidFutureDates();
      userService.findByIdOrNull.mockResolvedValue(mockTrainer);
      bookingAvailabilityService.assertTrainerCanBeBookedForRange.mockRejectedValue(
        new BadRequestException(ERROR_MESSAGES.BOOKING.TIME_SLOT_NOT_AVAILABLE),
      );

      await expect(
        service.create(
          { trainerId: mockTrainer.id, startTime, endTime },
          mockTrainee,
        ),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.create(
          { trainerId: mockTrainer.id, startTime, endTime },
          mockTrainee,
        ),
      ).rejects.toThrow(ERROR_MESSAGES.BOOKING.TIME_SLOT_NOT_AVAILABLE);
    });

    it('should create booking when valid', async () => {
      const { startTime, endTime } = createValidFutureDates();
      userService.findByIdOrNull.mockResolvedValue(mockTrainer);
      const createdBooking = {
        id: 'booking-uuid',
        trainee: mockTrainee,
        trainer: mockTrainer,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        status: BookingStatus.PENDING,
      };
      em.transactional.mockImplementation(
        async (handler: TransactionalHandler<Booking>) =>
          handler({
            create: jest.fn().mockReturnValue(createdBooking),
            persist: jest.fn().mockReturnValue({ flush: jest.fn() }),
            flush: jest.fn().mockResolvedValue(undefined),
          }),
      );

      const actual = await service.create(
        { trainerId: mockTrainer.id, startTime, endTime },
        mockTrainee,
      );

      expect(actual).toBe(createdBooking);
      expect(em.transactional).toHaveBeenCalled();
    });

    it('should throw time slot not available when transactional throws exclusion violation', async () => {
      const { startTime, endTime } = createValidFutureDates();
      userService.findByIdOrNull.mockResolvedValue(mockTrainer);
      em.transactional.mockRejectedValue({ code: '23P01' });

      await expect(
        service.create(
          { trainerId: mockTrainer.id, startTime, endTime },
          mockTrainee,
        ),
      ).rejects.toThrow(ERROR_MESSAGES.BOOKING.TIME_SLOT_NOT_AVAILABLE);
    });
  });

  describe('createBulk', () => {
    const buildBulkInput = (
      override: Partial<CreateBookingsBulkDto> = {},
    ): CreateBookingsBulkDto =>
      ({
        trainerId: mockTrainer.id,
        startDate: '2030-01-01',
        startClockTime: '10:00',
        endClockTime: '11:00',
        period: 'day',
        ...override,
      }) as CreateBookingsBulkDto;

    it('should throw NotFoundException when trainer not found', async () => {
      userService.findByIdOrNull.mockResolvedValue(null);

      await expect(
        service.createBulk(buildBulkInput(), mockTrainee),
      ).rejects.toThrow(ERROR_MESSAGES.USER.TRAINER_NOT_AVAILABLE);
    });

    it('should throw BadRequestException when trainee books self', async () => {
      userService.findByIdOrNull.mockResolvedValue(mockTrainee);

      await expect(
        service.createBulk(
          buildBulkInput({ trainerId: mockTrainee.id }),
          mockTrainee,
        ),
      ).rejects.toThrow(ERROR_MESSAGES.BOOKING.CANNOT_BOOK_SELF);
    });

    it('should throw BadRequestException when startDate is invalid', async () => {
      userService.findByIdOrNull.mockResolvedValue(mockTrainer);

      await expect(
        service.createBulk(
          buildBulkInput({ startDate: 'invalid' }),
          mockTrainee,
        ),
      ).rejects.toThrow('Invalid start date');
    });

    it('should throw BadRequestException when time format is invalid', async () => {
      userService.findByIdOrNull.mockResolvedValue(mockTrainer);

      await expect(
        service.createBulk(
          buildBulkInput({ startClockTime: 'xx:yy' }),
          mockTrainee,
        ),
      ).rejects.toThrow(ERROR_MESSAGES.BOOKING.INVALID_TIME_RANGE);
    });

    it('should throw BadRequestException when any occurrence is in the past', async () => {
      userService.findByIdOrNull.mockResolvedValue(mockTrainer);

      await expect(
        service.createBulk(
          buildBulkInput({
            startDate: '2020-01-01',
            startClockTime: '10:00',
            endClockTime: '11:00',
          }),
          mockTrainee,
        ),
      ).rejects.toThrow(ERROR_MESSAGES.BOOKING.CANNOT_BOOK_IN_PAST);
    });

    it('should throw BadRequestException when violates notice period', async () => {
      userService.findByIdOrNull.mockResolvedValue(mockTrainer);
      const startDateLocal = '2030-01-01';

      await expect(
        service.createBulk(
          buildBulkInput({
            startDate: startDateLocal,
            startClockTime: '00:10',
            endClockTime: '01:10',
            period: 'day',
          }),
          mockTrainee,
        ),
      ).rejects.toThrow(ERROR_MESSAGES.BOOKING.MUST_BOOK_BEFORE_30_MINUTES);
    });

    it('should create bulk booking series when valid', async () => {
      process.env.FRONTEND_URL = 'https://example.com/';
      userService.findByIdOrNull.mockResolvedValue(mockTrainer);
      bookingAvailabilityService.assertTrainerCanBeBookedForRange.mockResolvedValue(
        undefined,
      );
      const bulkInput = buildBulkInput({
        startDate: '2030-01-01',
        startClockTime: '10:00',
        endClockTime: '11:00',
        period: 'day',
      });
      const series = { id: 'series-id' } as BookingSeries;
      const createdBooking = {
        id: 'booking-1',
        trainer: mockTrainer,
        trainee: mockTrainee,
        series,
        startTime: new Date('2030-01-01T10:00:00.000Z'),
        endTime: new Date('2030-01-01T11:00:00.000Z'),
        status: BookingStatus.PENDING,
      } as Booking;
      em.transactional.mockImplementation(
        async (handler: TransactionalHandler<Booking[]>) =>
          handler({
            create: jest
              .fn()
              .mockImplementation(
                (entity: unknown, data: Record<string, unknown>): unknown => {
                  if (entity === BookingSeries) {
                    return { ...series, ...data } as BookingSeries;
                  }
                  if (entity === Booking) {
                    return { ...createdBooking, ...data } as Booking;
                  }
                  return { ...data };
                },
              ),
            persist: jest.fn(),
            flush: jest.fn().mockResolvedValue(undefined),
          }),
      );

      const actual = await service.createBulk(bulkInput, mockTrainee);

      expect(actual.length).toBe(1);
      expect(actual[0]?.status).toBe(BookingStatus.PENDING);
      expect(notificationsService.notifyAdmins).toHaveBeenCalled();
      expect(
        notificationsService.createAndPublishToUsers,
      ).toHaveBeenCalledTimes(2);
      expect(emailService.send).toHaveBeenCalled();
    });
  });

  describe('getAll', () => {
    it('should filter by trainee when current user is TRAINEE', async () => {
      const query = {
        page: DEFAULT_PAGE,
        limit: DEFAULT_LIMIT,
        order: SortOrder.DESC,
      };
      bookingRepo.findAndCount.mockResolvedValue([[], NO_OVERLAP_COUNT]);

      await service.getAll(query, mockTrainee);

      expect(bookingRepo.findAndCount).toHaveBeenCalledWith(
        { trainee: mockTrainee.id },
        expect.objectContaining({
          limit: DEFAULT_LIMIT,
          offset: 0,
          orderBy: { createdAt: SortOrder.DESC },
        }),
      );
    });

    it('should filter by trainer when current user is TRAINER', async () => {
      const query = {
        page: DEFAULT_PAGE,
        limit: DEFAULT_LIMIT,
        order: SortOrder.DESC,
      };
      bookingRepo.findAndCount.mockResolvedValue([[], NO_OVERLAP_COUNT]);

      await service.getAll(query, mockTrainer);

      expect(bookingRepo.findAndCount).toHaveBeenCalledWith(
        { trainer: mockTrainer.id },
        expect.objectContaining({
          limit: DEFAULT_LIMIT,
          offset: 0,
          orderBy: { createdAt: SortOrder.DESC },
        }),
      );
    });

    it('should allow admin to filter by traineeId and trainerId', async () => {
      const adminUser = { ...mockTrainee, role: UserRole.ADMIN } as User;
      const query = {
        page: DEFAULT_PAGE,
        limit: DEFAULT_LIMIT,
        order: SortOrder.DESC,
        traineeId: 'some-trainee-id',
        trainerId: 'some-trainer-id',
      };
      bookingRepo.findAndCount.mockResolvedValue([[], NO_OVERLAP_COUNT]);

      await service.getAll(query, adminUser);

      expect(bookingRepo.findAndCount).toHaveBeenCalledWith(
        {
          trainee: 'some-trainee-id',
          trainer: 'some-trainer-id',
        },
        expect.objectContaining({
          limit: DEFAULT_LIMIT,
          offset: 0,
        }),
      );
    });

    it('should return paginated result', async () => {
      const query = {
        page: PAGE_TWO,
        limit: LIMIT_FIVE,
        order: SortOrder.DESC,
      };
      const mockBookings = [{} as Booking];
      bookingRepo.findAndCount.mockResolvedValue([
        mockBookings,
        TOTAL_ITEMS_ONE,
      ]);

      const actual = await service.getAll(query, mockTrainee);

      expect(actual.data).toEqual(mockBookings);
      expect(actual.meta).toEqual(
        expect.objectContaining({
          page: PAGE_TWO,
          limit: LIMIT_FIVE,
          totalItems: TOTAL_ITEMS_ONE,
          totalPages: TOTAL_PAGES_ONE,
        }),
      );
    });
  });

  describe('updateStatus', () => {
    it('should throw NotFoundException when booking not found', async () => {
      bookingRepo.findById.mockResolvedValue(null);

      await expect(
        service.updateStatus(
          'missing-id',
          { status: BookingStatus.CONFIRMED },
          mockTrainee,
        ),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.updateStatus(
          'missing-id',
          { status: BookingStatus.CONFIRMED },
          mockTrainee,
        ),
      ).rejects.toThrow(ERROR_MESSAGES.BOOKING.NOT_FOUND);
    });

    it('should throw BadRequestException when user is not admin nor trainer of booking', async () => {
      const booking = {
        id: 'booking-id',
        trainer: mockTrainer,
        trainee: mockTrainee,
        status: BookingStatus.PENDING,
      };
      bookingRepo.findById.mockResolvedValue(booking);
      const otherUser = { ...mockTrainee, id: 'other-user-id' } as User;

      await expect(
        service.updateStatus(
          booking.id,
          { status: BookingStatus.CONFIRMED },
          otherUser,
        ),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.updateStatus(
          booking.id,
          { status: BookingStatus.CONFIRMED },
          otherUser,
        ),
      ).rejects.toThrow(ERROR_MESSAGES.BOOKING.CANNOT_UPDATE_STATUS);
    });

    it('should update status when user is trainer of booking', async () => {
      const booking = {
        id: 'booking-id',
        trainer: mockTrainer,
        trainee: mockTrainee,
        status: BookingStatus.PENDING,
      };
      bookingRepo.findById.mockResolvedValue(booking);

      const actual = await service.updateStatus(
        booking.id,
        { status: BookingStatus.CONFIRMED },
        mockTrainer,
      );

      expect(actual.status).toBe(BookingStatus.CONFIRMED);
      expect(bookingRepo.save).toHaveBeenCalled();
    });

    it('should update status when user is admin', async () => {
      const adminUser = { ...mockTrainee, role: UserRole.ADMIN } as User;
      const booking = {
        id: 'booking-id',
        trainer: mockTrainer,
        trainee: mockTrainee,
        status: BookingStatus.PENDING,
      };
      bookingRepo.findById.mockResolvedValue(booking);

      const actual = await service.updateStatus(
        booking.id,
        { status: BookingStatus.REJECTED, rejectionReason: 'Not available' },
        adminUser,
      );

      expect(actual.status).toBe(BookingStatus.REJECTED);
      expect(bookingRepo.save).toHaveBeenCalled();
    });

    it('should require rejectionReason when rejecting', async () => {
      const adminUser = { ...mockTrainee, role: UserRole.ADMIN } as User;
      const booking = {
        id: 'booking-id',
        trainer: mockTrainer,
        trainee: mockTrainee,
        status: BookingStatus.PENDING,
      };
      bookingRepo.findById.mockResolvedValue(booking);

      await expect(
        service.updateStatus(
          booking.id,
          { status: BookingStatus.REJECTED, rejectionReason: ' ' },
          adminUser,
        ),
      ).rejects.toThrow('Rejection reason is required');
    });

    it('should require cancellationReason when cancelling', async () => {
      const booking = {
        id: 'booking-id',
        trainer: mockTrainer,
        trainee: mockTrainee,
        status: BookingStatus.PENDING,
      };
      bookingRepo.findById.mockResolvedValue(booking);

      await expect(
        service.updateStatus(
          booking.id,
          { status: BookingStatus.CANCELLED, cancellationReason: ' ' },
          mockTrainer,
        ),
      ).rejects.toThrow('Cancellation reason is required');
    });

    it('should send side effects when confirming booking', async () => {
      process.env.FRONTEND_URL = 'https://example.com/';
      const booking = {
        id: 'booking-id',
        trainer: mockTrainer,
        trainee: mockTrainee,
        status: BookingStatus.PENDING,
        startTime: new Date('2030-01-01T10:00:00.000Z'),
        endTime: new Date('2030-01-01T11:00:00.000Z'),
      } as Booking;
      bookingRepo.findById.mockResolvedValue(booking);

      const actual = await service.updateStatus(
        booking.id,
        { status: BookingStatus.CONFIRMED },
        mockTrainer,
      );

      expect(actual.status).toBe(BookingStatus.CONFIRMED);
      expect(notificationsService.createAndPublishToUsers).toHaveBeenCalled();
      expect(emailService.send).toHaveBeenCalled();
    });

    it('should send side effects when rejecting booking', async () => {
      process.env.FRONTEND_URL = 'https://example.com/';
      const booking = {
        id: 'booking-id',
        trainer: mockTrainer,
        trainee: mockTrainee,
        status: BookingStatus.PENDING,
        startTime: new Date('2030-01-01T10:00:00.000Z'),
        endTime: new Date('2030-01-01T11:00:00.000Z'),
        rejectionReason: null,
      } as Booking;
      bookingRepo.findById.mockResolvedValue(booking);

      const actual = await service.updateStatus(
        booking.id,
        { status: BookingStatus.REJECTED, rejectionReason: 'Not available' },
        mockTrainer,
      );

      expect(actual.status).toBe(BookingStatus.REJECTED);
      expect(notificationsService.createAndPublishToUsers).toHaveBeenCalled();
      expect(emailService.send).toHaveBeenCalled();
    });

    it('should send side effects when trainer cancels booking', async () => {
      process.env.FRONTEND_URL = 'https://example.com/';
      const booking = {
        id: 'booking-id',
        trainer: mockTrainer,
        trainee: mockTrainee,
        status: BookingStatus.PENDING,
        startTime: new Date('2030-01-01T10:00:00.000Z'),
        endTime: new Date('2030-01-01T11:00:00.000Z'),
        cancellationReason: null,
      } as Booking;
      bookingRepo.findById.mockResolvedValue(booking);

      const actual = await service.updateStatus(
        booking.id,
        { status: BookingStatus.CANCELLED, cancellationReason: 'Busy' },
        mockTrainer,
      );

      expect(actual.status).toBe(BookingStatus.CANCELLED);
      expect(notificationsService.createAndPublishToUsers).toHaveBeenCalled();
      expect(emailService.send).toHaveBeenCalled();
    });

    it('should send side effects when trainee cancels booking', async () => {
      process.env.FRONTEND_URL = 'https://example.com/';
      const booking = {
        id: 'booking-id',
        trainer: mockTrainer,
        trainee: mockTrainee,
        status: BookingStatus.PENDING,
        startTime: new Date('2030-01-01T10:00:00.000Z'),
        endTime: new Date('2030-01-01T11:00:00.000Z'),
        cancellationReason: null,
      } as Booking;
      bookingRepo.findById.mockResolvedValue(booking);

      const actual = await service.updateStatus(
        booking.id,
        { status: BookingStatus.CANCELLED, cancellationReason: 'Sick' },
        mockTrainee,
      );

      expect(actual.status).toBe(BookingStatus.CANCELLED);
      expect(notificationsService.createAndPublishToUsers).toHaveBeenCalled();
      expect(emailService.send).toHaveBeenCalled();
    });
  });

  describe('getOne', () => {
    it('should return placeholder string', () => {
      const actual = service.getOne('some-id');
      expect(actual).toBe('This action returns a #some-id booking');
    });
  });

  describe('findBookingById', () => {
    it('should delegate to repository', async () => {
      const booking = { id: 'booking-id' } as Booking;
      bookingRepo.findById.mockResolvedValue(booking);

      const actual = await service.findBookingById('booking-id');

      expect(actual).toBe(booking);
      expect(bookingRepo.findById).toHaveBeenCalledWith('booking-id');
    });
  });

  describe('findTraineeIdsByTrainerId', () => {
    it('should return trainee ids from repository', async () => {
      bookingRepo.findTraineeIdsByTrainerId.mockResolvedValue(['a', 'b']);

      const actual = await service.findTraineeIdsByTrainerId('trainer-id');

      expect(actual).toEqual(['a', 'b']);
    });
  });
});
