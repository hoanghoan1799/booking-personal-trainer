import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from '@mikro-orm/core';

import { BookingStatus } from '../../../../common/enums/booking/booking.enum';

import { Booking } from '../../../booking/entities/booking.entity';
import { User } from '../../../user/entities/user.entity';
import { LoyalUsersReportService } from '../loyal-users-report.service';

describe('LoyalUsersReportService', () => {
  let service: LoyalUsersReportService;
  let em: { find: jest.Mock };

  const traineeA = {
    id: 'a',
    firstName: 'A',
    lastName: 'User',
    email: 'a@x.com',
    userName: 'a',
  } as User;
  const traineeB = {
    id: 'b',
    firstName: 'B',
    lastName: 'User',
    email: 'b@x.com',
    userName: 'b',
  } as User;

  beforeEach(async () => {
    em = { find: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoyalUsersReportService,
        { provide: EntityManager, useValue: em },
      ],
    }).compile();
    service = module.get(LoyalUsersReportService);
  });

  it('ranks users by bookingsCount and applies limit', async () => {
    const bookings: Booking[] = [
      { trainee: traineeA, status: BookingStatus.PENDING } as Booking,
      { trainee: traineeA, status: BookingStatus.CONFIRMED } as Booking,
      { trainee: traineeB, status: BookingStatus.CONFIRMED } as Booking,
    ];
    em.find.mockImplementation((entity: unknown) => {
      if (entity === Booking) {
        return Promise.resolve(bookings);
      }
      if (entity === User) {
        return Promise.resolve([traineeA, traineeB]);
      }
      return Promise.resolve([]);
    });
    const actual = await service.getLoyalUsers({
      query: { limit: 1 },
      trainerUserIdFilter: null,
    });
    expect(actual).toHaveLength(1);
    expect(actual[0]?.userId).toBe('a');
    expect(actual[0]?.bookingsCount).toBe(2);
    expect(actual[0]?.confirmedBookingsCount).toBe(1);
  });
});
