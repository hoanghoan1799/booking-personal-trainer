import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EntityManager, EntityRepository, FilterQuery } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';

// Commons
import { BookingStatus } from '../../common/enums/booking/booking.enum';
import { ERROR_MESSAGES } from '../../common/constants/message.constant';
import { addMinutesToDate } from '../../common/helpers/time.helper';
import { BaseResponseDto } from '../../common/dtos/base-response.dto';

// Entities
import { Booking } from './entities/booking.entity';
import { User } from '../user/entities/user.entity';

// DTOs
import { GetBookingsQueryDto } from './dtos/get-booking.dto';
import { CreateBookingDto } from './dtos/create-booking.dto';

// Services
import { UserService } from '../user/user.service';

@Injectable()
export class BookingService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepo: EntityRepository<Booking>,
    private readonly userService: UserService,
    private readonly em: EntityManager,
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

    const trainer = await this.userService.findById(trainerId);

    if (!trainer) {
      throw new NotFoundException(ERROR_MESSAGES.USER.TRAINER_NOT_AVAILABLE);
    }

    if (trainer.id === currentUser.id) {
      throw new BadRequestException(ERROR_MESSAGES.BOOKING.CANNOT_BOOK_SELF);
    }

    const overlap = await this.bookingRepo.count({
      trainer,
      status: { $ne: BookingStatus.REJECTED },
      $or: [
        {
          startTime: { $lt: endTime },
          endTime: { $gt: startTime },
        },
      ],
    });

    if (overlap > 0) {
      throw new BadRequestException(
        ERROR_MESSAGES.BOOKING.TIME_SLOT_NOT_AVAILABLE,
      );
    }

    const booking = this.bookingRepo.create({
      trainee: currentUser,
      trainer,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      status: BookingStatus.PENDING,
    });

    await this.em.persist(booking).flush();

    return booking;
  }

  async getAll(
    query: GetBookingsQueryDto,
  ): Promise<BaseResponseDto<Booking[]>> {
    const { page, limit, status, traineeId, trainerId, order } = query;

    const where: FilterQuery<Booking> = {};

    if (status) {
      where.status = status;
    }

    if (traineeId) {
      where.trainee = traineeId;
    }

    if (trainerId) {
      where.trainer = trainerId;
    }

    const [bookings, totalItems] = await this.bookingRepo.findAndCount(where, {
      populate: ['trainee', 'trainer'],
      limit,
      offset: (page - 1) * limit,
      orderBy: {
        createdAt: order,
      },
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
}
