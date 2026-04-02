import { Entity, Property, Enum, ManyToOne } from '@mikro-orm/core';

// Commons
import { BaseEntity } from '../../../common/entities/base.entity';
import { BookingStatus } from '../../../common/enums/booking/booking.enum';

// Entities
import { User } from '../../../modules/user/entities/user.entity';

@Entity({ tableName: 'bookings' })
export class Booking extends BaseEntity {
  @ManyToOne(() => User)
  trainer!: User;

  @ManyToOne(() => User)
  trainee!: User;

  @Enum(() => BookingStatus)
  status: BookingStatus = BookingStatus.PENDING;

  @Property()
  startTime!: Date;

  @Property()
  endTime!: Date;
}
