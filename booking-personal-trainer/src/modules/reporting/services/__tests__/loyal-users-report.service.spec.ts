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

  it('returns empty when there are no bookings', async () => {
    em.find.mockResolvedValue([]);

    const actual = await service.getLoyalUsers({
      query: {},
      trainerUserIdFilter: null,
    });

    expect(actual).toEqual([]);
  });

  it('still returns rows when User lookup returns empty', async () => {
    const bookings: Booking[] = [
      { trainee: traineeA, status: BookingStatus.CONFIRMED } as Booking,
    ];
    em.find.mockImplementation((entity: unknown) => {
      if (entity === Booking) {
        return Promise.resolve(bookings);
      }
      if (entity === User) {
        return Promise.resolve([]);
      }
      return Promise.resolve([]);
    });

    const actual = await service.getLoyalUsers({
      query: {},
      trainerUserIdFilter: null,
    });

    expect(actual).toHaveLength(1);
    expect(actual[0]).toMatchObject({
      userId: 'a',
      userName: '',
      userEmail: '',
      bookingsCount: 1,
      confirmedBookingsCount: 1,
    });
  });

  it('passes createdAt range and trainer filter to queries', async () => {
    const inputFrom = new Date('2026-01-01T00:00:00.000Z');
    const inputTo = new Date('2026-02-01T00:00:00.000Z');
    em.find.mockImplementation((entity: unknown) => {
      if (entity === Booking) {
        return Promise.resolve([]);
      }
      if (entity === User) {
        return Promise.resolve([]);
      }
      return Promise.resolve([]);
    });

    await service.getLoyalUsers({
      query: { from: inputFrom, to: inputTo, limit: 10 },
      trainerUserIdFilter: 'trainer-1',
    });

    const findMock = em.find as unknown as jest.Mock<
      Promise<unknown>,
      unknown[]
    >;
    const callsUnknown: unknown = findMock.mock.calls;
    if (!Array.isArray(callsUnknown)) {
      throw new Error('Expected em.find mock calls to be an array');
    }
    const calls = callsUnknown as unknown[][];
    const bookingCallUnknown: unknown =
      calls.find((c) => Array.isArray(c) && c[0] === Booking) ?? null;
    if (!bookingCallUnknown || !Array.isArray(bookingCallUnknown)) {
      throw new Error('Expected em.find to be called for Booking');
    }
    const bookingWhere = (bookingCallUnknown[1] ?? null) as unknown as {
      readonly createdAt?: { readonly $gte?: Date; readonly $lt?: Date };
      readonly trainer?: string;
    };
    expect(bookingWhere.trainer).toBe('trainer-1');
    expect(bookingWhere.createdAt?.$gte).toEqual(inputFrom);
    expect(bookingWhere.createdAt?.$lt).toEqual(inputTo);
  });
});
