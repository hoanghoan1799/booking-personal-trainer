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

type TransactionalEntityManagerMock = {
  readonly create: jest.Mock;
  readonly persist: jest.Mock;
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

describe('BookingService', () => {
  let service: BookingService;
  let bookingRepo: {
    countOverlapping: jest.Mock;
    create: jest.Mock;
    findById: jest.Mock;
    findAndCount: jest.Mock;
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
    bookingRepo = {
      countOverlapping: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
      findAndCount: jest.fn(),
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

  describe('create', () => {
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
          }),
      );

      const actual = await service.create(
        { trainerId: mockTrainer.id, startTime, endTime },
        mockTrainee,
      );

      expect(actual).toBe(createdBooking);
      expect(em.transactional).toHaveBeenCalled();
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
  });

  describe('getOne', () => {
    it('should return placeholder string', () => {
      const actual = service.getOne('some-id');
      expect(actual).toBe('This action returns a #some-id booking');
    });
  });
});
