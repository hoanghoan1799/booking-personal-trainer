import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

// Commons
import { UserRole } from '../../common/enums/user/user.enum';
import { BookingStatus } from '../../common/enums/booking/booking.enum';
import { ERROR_MESSAGES } from '../../common/constants/message.constant';
import { addMinutesToDate } from '../../common/helpers/time.helper';
import { BaseResponseDto } from '../../common/dtos/base-response.dto';
import { SortOrder } from '../../common/enums/pagination/pagination.enum';

// Entities
import { Booking } from './entities/booking.entity';
import { User } from '../user/entities/user.entity';

// Services
import { BookingAvailabilityService } from './services/booking-availability.service';

// DTOs
import { GetBookingsQueryDto } from './dtos/get-booking.dto';
import { CreateBookingDto } from './dtos/create-booking.dto';

// Repositories
import {
  BookingRepositoryToken,
  type BookingRepository,
  type BookingFindManyFilter,
} from './repositories/booking.repository.interface';
import { UserRepositoryToken } from '../user/repositories/user.repository.interface';
import type { UserRepository } from '../user/repositories/user.repository.interface';

@Injectable()
export class BookingService {
  constructor(
    @Inject(BookingRepositoryToken)
    private readonly bookingRepo: BookingRepository,
    @Inject(UserRepositoryToken)
    private readonly userRepo: UserRepository,
    private readonly bookingAvailabilityService: BookingAvailabilityService,
  ) {}

  async create(data: CreateBookingDto, currentUser: User): Promise<Booking> {
    const { trainerId, startTime, endTime } = data;

    const start = new Date(startTime);
    const end = new Date(endTime);
    const now = new Date();

    if (start >= end) {
      throw new BadRequestException(ERROR_MESSAGES.BOOKING.INVALID_TIME_RANGE);
    }

    if (start.getTime() <= now.getTime()) {
      throw new BadRequestException(ERROR_MESSAGES.BOOKING.CANNOT_BOOK_IN_PAST);
    }

    const earliestAllowedTime = addMinutesToDate(now, 30);

    if (start.getTime() < earliestAllowedTime.getTime()) {
      throw new BadRequestException(
        ERROR_MESSAGES.BOOKING.MUST_BOOK_BEFORE_30_MINUTES,
      );
    }

    const trainer = await this.userRepo.findById(trainerId);

    if (!trainer) {
      throw new NotFoundException(ERROR_MESSAGES.USER.TRAINER_NOT_AVAILABLE);
    }

    if (trainer.id === currentUser.id) {
      throw new BadRequestException(ERROR_MESSAGES.BOOKING.CANNOT_BOOK_SELF);
    }

    await this.bookingAvailabilityService.assertTrainerCanBeBookedForRange({
      trainerId,
      start,
      end,
    });

    const booking = await this.bookingRepo.create({
      trainer,
      trainee: currentUser,
      startTime: start,
      endTime: end,
      status: BookingStatus.PENDING,
    });

    return booking;
  }

  async getAll(
    query: GetBookingsQueryDto,
    currentUser: User,
  ): Promise<BaseResponseDto<Booking[]>> {
    const { page, limit, status, traineeId, trainerId, order } = query;

    const filter: BookingFindManyFilter = {};

    switch (currentUser.role) {
      case UserRole.ADMIN:
        break;
      case UserRole.TRAINER:
        filter.trainer = currentUser.id;
        break;
      case UserRole.TRAINEE:
        filter.trainee = currentUser.id;
        break;
      default:
        filter.trainee = currentUser.id;
    }

    if (currentUser.role === UserRole.ADMIN) {
      if (traineeId) {
        filter.trainee = traineeId;
      }
      if (trainerId) {
        filter.trainer = trainerId;
      }
    }

    if (status) {
      filter.status = status;
    }

    const [bookings, totalItems] = await this.bookingRepo.findAndCount(filter, {
      limit,
      offset: (page - 1) * limit,
      orderBy: { createdAt: order ?? SortOrder.DESC },
    });

    return BaseResponseDto.okWithPagination(bookings, {
      totalItems,
      page,
      limit,
    });
  }

  getOne(id: string) {
    return `This action returns a #${id} booking`;
  }

  async updateStatus(
    id: string,
    status: BookingStatus,
    currentUser: User,
  ): Promise<Booking> {
    const booking = await this.bookingRepo.findById(id);

    if (!booking) {
      throw new NotFoundException(ERROR_MESSAGES.BOOKING.NOT_FOUND);
    }

    const isAdmin = currentUser.role === UserRole.ADMIN;
    const isTrainerOfBooking = booking.trainer.id === currentUser.id;

    if (!isAdmin && !isTrainerOfBooking) {
      throw new BadRequestException(
        ERROR_MESSAGES.BOOKING.CANNOT_UPDATE_STATUS,
      );
    }

    booking.status = status;
    await this.bookingRepo.save(booking);

    return booking;
  }
}
