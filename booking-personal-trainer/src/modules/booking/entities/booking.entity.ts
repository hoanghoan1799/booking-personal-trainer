import { Entity, Property, Enum, ManyToOne } from '@mikro-orm/core';

// Commons
import { BaseEntity } from '../../../common/entities/base.entity';
import { BookingStatus } from '../../../common/enums/booking/booking.enum';

// Entities
import { User } from '../../../modules/user/entities/user.entity';
import { BookingSeries } from './booking-series.entity';

@Entity({ tableName: 'bookings' })
export class Booking extends BaseEntity {
  @ManyToOne(() => User)
  trainer!: User;

  @ManyToOne(() => User)
  trainee!: User;

  @ManyToOne(() => BookingSeries, { nullable: true, fieldName: 'series_id' })
  series?: BookingSeries | null;

  @Enum(() => BookingStatus)
  status: BookingStatus = BookingStatus.PENDING;

  @ManyToOne(() => User, { nullable: true, fieldName: 'cancelled_by' })
  cancelledBy?: User | null;

  @Property({ nullable: true })
  statusChangedAt?: Date | null;

  @Property({ type: 'text', nullable: true })
  cancellationReason?: string | null;

  @Property({ type: 'text', nullable: true })
  rejectionReason?: string | null;

  @Property()
  startTime!: Date;

  @Property()
  endTime!: Date;
}
