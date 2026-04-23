import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from '@mikro-orm/core';

import { BookingStatus } from '../../../../common/enums/booking/booking.enum';
import { PaymentStatus } from '../../../../common/enums/billing/billing.enum';
import { WorkoutStatus } from '../../../../common/enums/workout/workout.enum';

import { Booking } from '../../../booking/entities/booking.entity';
import { Payment } from '../../../payments/entities/payment.entity';
import { User } from '../../../user/entities/user.entity';
import { Workout } from '../../../workout/entities/workout.entity';
import { TrainerKpiReportService } from '../trainer-kpi-report.service';

describe('TrainerKpiReportService', () => {
  let service: TrainerKpiReportService;
  let em: { find: jest.Mock };

  const trainerUser = {
    id: 'trainer-1',
    firstName: 'T',
    lastName: 'One',
    email: 't1@example.com',
    userName: 't1',
  } as User;

  beforeEach(async () => {
    em = { find: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TrainerKpiReportService,
        { provide: EntityManager, useValue: em },
      ],
    }).compile();
    service = module.get(TrainerKpiReportService);
  });

  it('aggregates booking statuses and DONE workout minutes', async () => {
    const bookingConfirmed = {
      trainer: trainerUser,
      status: BookingStatus.CONFIRMED,
    } as Booking;
    const bookingCancelled = {
      trainer: trainerUser,
      status: BookingStatus.CANCELLED,
    } as Booking;
    const workoutDone = {
      trainer: trainerUser,
      status: WorkoutStatus.DONE,
      startTime: new Date('2026-01-01T00:00:00.000Z'),
      endTime: new Date('2026-01-01T01:30:00.000Z'),
      isDeleted: false,
    } as Workout;
    em.find.mockImplementation((entity: unknown) => {
      if (entity === Booking) {
        return Promise.resolve([bookingConfirmed, bookingCancelled]);
      }
      if (entity === Workout) {
        return Promise.resolve([workoutDone]);
      }
      if (entity === Payment) {
        return Promise.resolve([]);
      }
      return Promise.resolve([]);
    });
    const actual = await service.getTrainerKpiRows({
      query: {},
      trainerUserIdFilter: 'trainer-1',
    });
    expect(actual).toHaveLength(1);
    expect(actual[0]).toMatchObject({
      trainerId: 'trainer-1',
      confirmedBookingsCount: 1,
      cancelledBookingsCount: 1,
      rejectedBookingsCount: 0,
      workoutsDoneCount: 1,
      deliveredMinutes: 90,
      trainerShareNetCents: 0,
    });
  });

  it('sums trainer share from PAID payments for matching currency', async () => {
    const payment = {
      status: PaymentStatus.PAID,
      amountCents: 2000,
      currency: 'USD',
      paidAt: new Date(),
      refundedAt: null,
      metadata: {
        trainerUserId: 'trainer-1',
        platformFeeCents: 200,
        trainerShareCents: 1800,
      },
    } as unknown as Payment;
    em.find.mockImplementation((entity: unknown) => {
      if (entity === Booking) {
        return Promise.resolve([]);
      }
      if (entity === Workout) {
        return Promise.resolve([]);
      }
      if (entity === Payment) {
        return Promise.resolve([payment]);
      }
      return Promise.resolve([]);
    });
    const actual = await service.getTrainerKpiRows({
      query: { currency: 'USD' },
      trainerUserIdFilter: 'trainer-1',
    });
    expect(actual[0]?.trainerShareNetCents).toBe(1800);
  });
});
