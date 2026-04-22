import { Entity, ManyToOne, Property, Enum } from '@mikro-orm/core';

import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../../modules/user/entities/user.entity';

export type BookingSeriesPeriod = 'day' | 'week' | 'month' | 'year';

@Entity({ tableName: 'booking_series' })
export class BookingSeries extends BaseEntity {
  @ManyToOne(() => User)
  trainer!: User;

  @ManyToOne(() => User)
  trainee!: User;

  @Property()
  startDate!: Date;

  @Property()
  endDate!: Date;

  @Property({ type: 'text' })
  startClockTime!: string;

  @Property({ type: 'text' })
  endClockTime!: string;

  @Enum({ items: () => ['day', 'week', 'month', 'year'] })
  period!: BookingSeriesPeriod;
}
