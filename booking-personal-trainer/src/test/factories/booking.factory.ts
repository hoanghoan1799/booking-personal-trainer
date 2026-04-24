import { EntityManager } from '@mikro-orm/core';

// Enums
import { BookingStatus } from '../../common/enums/booking/booking.enum';

// Entities
import { Booking } from '../../modules/booking/entities/booking.entity';
import { User } from '../../modules/user/entities/user.entity';

export type CreateTestBookingInput = {
  readonly trainer: User;
  readonly trainee: User;
  readonly startTime: Date;
  readonly endTime: Date;
  readonly status?: BookingStatus;
};

export const createTestBooking = async (
  em: EntityManager,
  input: CreateTestBookingInput,
): Promise<Booking> => {
  const row: Booking = em.create(Booking, {
    trainer: input.trainer,
    trainee: input.trainee,
    startTime: input.startTime,
    endTime: input.endTime,
    status: input.status ?? BookingStatus.PENDING,
  });
  await em.persistAndFlush(row);
  return row;
};
