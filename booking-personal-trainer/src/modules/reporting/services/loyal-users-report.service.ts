import { Injectable } from '@nestjs/common';
import { EntityManager, FilterQuery } from '@mikro-orm/core';

import { BookingStatus } from '../../../common/enums/booking/booking.enum';

import { Booking } from '../../booking/entities/booking.entity';
import { User } from '../../user/entities/user.entity';
import { LoyalUsersQueryDto } from '../dtos/loyal-users-query.dto';
import { LoyalUserRowDto } from '../dtos/loyal-user-row.dto';

type MutableLoyalty = {
  userId: string;
  bookingsCount: number;
  confirmedBookingsCount: number;
};

@Injectable()
export class LoyalUsersReportService {
  constructor(private readonly em: EntityManager) {}

  /**
   * Ranks users by booking count (bookings filtered by createdAt).
   */
  public async getLoyalUsers(input: {
    readonly query: LoyalUsersQueryDto;
    readonly trainerUserIdFilter: string | null;
  }): Promise<LoyalUserRowDto[]> {
    const limit: number = input.query.limit ?? 50;
    const createdAtFilter: { $gte?: Date; $lt?: Date } | undefined =
      this.buildCreatedAtRange({
        from: input.query.from,
        to: input.query.to,
      });
    const where: FilterQuery<Booking> = {};
    if (createdAtFilter) {
      where.createdAt = createdAtFilter;
    }
    if (input.trainerUserIdFilter != null) {
      where.trainer = input.trainerUserIdFilter;
    }
    const bookings: Booking[] = await this.em.find(Booking, where, {
      populate: ['trainee'],
    });
    const loyaltyByUserId = new Map<string, MutableLoyalty>();
    for (const booking of bookings) {
      const userId: string = booking.trainee.id;
      const existing: MutableLoyalty | undefined = loyaltyByUserId.get(userId);
      const row: MutableLoyalty = existing ?? {
        userId,
        bookingsCount: 0,
        confirmedBookingsCount: 0,
      };
      row.bookingsCount += 1;
      if (booking.status === BookingStatus.CONFIRMED) {
        row.confirmedBookingsCount += 1;
      }
      if (!existing) {
        loyaltyByUserId.set(userId, row);
      }
    }
    const userIds: string[] = Array.from(loyaltyByUserId.keys());
    const users: User[] =
      userIds.length === 0
        ? []
        : await this.em.find(User, { id: { $in: userIds } });
    const userById = new Map<string, User>(users.map((u) => [u.id, u]));
    const rows: LoyalUserRowDto[] = userIds.map((userId: string) => {
      const loyalty: MutableLoyalty = loyaltyByUserId.get(userId)!;
      const user: User | undefined = userById.get(userId);
      return {
        userId,
        userName: user ? this.formatUserName(user) : '',
        userEmail: user?.email ?? '',
        bookingsCount: loyalty.bookingsCount,
        confirmedBookingsCount: loyalty.confirmedBookingsCount,
      };
    });
    rows.sort((a, b) => {
      if (b.bookingsCount !== a.bookingsCount) {
        return b.bookingsCount - a.bookingsCount;
      }
      return a.userName.localeCompare(b.userName);
    });
    return rows.slice(0, limit);
  }

  private buildCreatedAtRange(input: {
    readonly from?: Date;
    readonly to?: Date;
  }): { $gte?: Date; $lt?: Date } | undefined {
    if (!input.from && !input.to) {
      return undefined;
    }
    const range: { $gte?: Date; $lt?: Date } = {};
    if (input.from) {
      range.$gte = input.from;
    }
    if (input.to) {
      range.$lt = input.to;
    }
    return range;
  }

  private formatUserName(user: User): string {
    const firstName: string = user.firstName ?? '';
    const lastName: string = user.lastName ?? '';
    const fullName: string = `${firstName} ${lastName}`.trim();
    return fullName !== ''
      ? fullName
      : (user.userName ?? user.email ?? user.id);
  }
}
