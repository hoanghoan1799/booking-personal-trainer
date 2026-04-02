import { Injectable } from '@nestjs/common';
import { EntityManager, EntityRepository, FilterQuery } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';

import { BookingStatus } from '../../../common/enums/booking/booking.enum';
import { Booking } from '../entities/booking.entity';
import {
  BookingRepository,
  CreateBookingData,
  BookingFindManyFilter,
  FindManyOptions,
} from './booking.repository.interface';

@Injectable()
export class MikroOrmBookingRepository implements BookingRepository {
  constructor(
    @InjectRepository(Booking)
    private readonly repo: EntityRepository<Booking>,
    private readonly em: EntityManager,
  ) {}

  async create(data: CreateBookingData): Promise<Booking> {
    const booking = this.repo.create({
      trainer: data.trainer,
      trainee: data.trainee,
      startTime: data.startTime,
      endTime: data.endTime,
      status: data.status,
    });
    await this.em.persist(booking).flush();
    return booking;
  }

  async findById(id: string): Promise<Booking | null> {
    return this.repo.findOne({ id }, { populate: ['trainer', 'trainee'] });
  }

  async findAndCount(
    filter: BookingFindManyFilter,
    options: FindManyOptions,
  ): Promise<[Booking[], number]> {
    const where: FilterQuery<Booking> = {};
    if (filter.trainer != null) {
      where.trainer = filter.trainer;
    }
    if (filter.trainee != null) {
      where.trainee = filter.trainee;
    }
    if (filter.status != null) {
      where.status = filter.status;
    }
    return this.repo.findAndCount(where, {
      populate: ['trainee', 'trainer'],
      limit: options.limit,
      offset: options.offset,
      orderBy: options.orderBy as Record<string, 'ASC' | 'DESC'>,
    });
  }

  async countOverlapping(
    trainerId: string,
    startTime: Date,
    endTime: Date,
    excludeStatus?: BookingStatus,
  ): Promise<number> {
    const where: FilterQuery<Booking> = {
      trainer: trainerId,
      $or: [
        {
          startTime: { $lt: endTime },
          endTime: { $gt: startTime },
        },
      ],
    };
    if (excludeStatus != null) {
      where.status = { $ne: excludeStatus };
    }
    return this.repo.count(where);
  }

  async findTraineeIdsByTrainerId(trainerId: string): Promise<string[]> {
    const bookings = await this.em.find(
      Booking,
      { trainer: trainerId },
      { fields: ['trainee'], populate: ['trainee'] },
    );
    return [...new Set(bookings.map((b) => b.trainee.id))];
  }

  async save(booking: Booking): Promise<void> {
    await this.em.persist(booking).flush();
  }
}
