import { Entity, Index, ManyToOne, Property, Enum } from '@mikro-orm/core';
import { Expose } from 'class-transformer';

// Commons
import { BaseEntity } from '../../../common/entities/base.entity';

// Entities
import { User } from '../../user/entities/user.entity';

// Enums
import { NotificationType } from '../enums/notification-type.enum';

type NotificationData = Record<string, unknown>;

@Index({ properties: ['recipient'] })
@Index({ properties: ['isRead'] })
@Index({ properties: ['type'] })
@Index({ properties: ['createdAt'] })
@Entity({ tableName: 'notifications' })
export class Notification extends BaseEntity {
  @Expose()
  @ManyToOne(() => User)
  recipient!: User;

  @Expose()
  @Enum(() => NotificationType)
  type!: NotificationType;

  @Expose()
  @Property({ type: 'text' })
  title!: string;

  @Expose()
  @Property({ type: 'text' })
  message!: string;

  @Expose()
  @Property({ type: 'json', nullable: true })
  data?: NotificationData | null;

  @Expose()
  @Property({ default: false })
  isRead: boolean = false;
}
