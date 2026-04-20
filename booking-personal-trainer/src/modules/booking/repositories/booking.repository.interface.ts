import { BookingStatus } from '../../../common/enums/booking/booking.enum';
import { SortOrder } from '../../../common/enums/pagination/pagination.enum';
import { User } from '../../user/entities/user.entity';
import { Booking } from '../entities/booking.entity';
import type { EntityManager } from '@mikro-orm/core';

/** Injection token for BookingRepository */
export const BookingRepositoryToken = Symbol('BookingRepository');

export interface CreateBookingData {
  trainer: User;
  trainee: User;
  startTime: Date;
  endTime: Date;
  status: BookingStatus;
}

export interface BookingFindManyFilter {
  trainer?: string;
  trainee?: string;
  status?: BookingStatus;
}

export interface FindManyOptions {
  limit: number;
  offset: number;
  orderBy: Record<string, SortOrder>;
}

/**
 * Port for booking persistence. Implement with MikroORM, Prisma, TypeORM, etc.
 */
export interface BookingRepository {
  transactional<T>(handler: (em: EntityManager) => Promise<T>): Promise<T>;
  create(data: CreateBookingData): Promise<Booking>;
  findById(id: string): Promise<Booking | null>;
  findAndCount(
    filter: BookingFindManyFilter,
    options: FindManyOptions,
  ): Promise<[Booking[], number]>;
  countOverlapping(
    trainerId: string,
    startTime: Date,
    endTime: Date,
    excludeStatuses?: readonly BookingStatus[],
  ): Promise<number>;
  findOverlappingForTrainer(
    trainerId: string,
    startTime: Date,
    endTime: Date,
    excludeStatuses?: readonly BookingStatus[],
  ): Promise<Booking[]>;
  findTraineeIdsByTrainerId(trainerId: string): Promise<string[]>;
  save(booking: Booking): Promise<void>;
}
