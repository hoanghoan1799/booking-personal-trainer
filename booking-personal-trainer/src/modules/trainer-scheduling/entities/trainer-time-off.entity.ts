import { Entity, ManyToOne, Property } from '@mikro-orm/core';

// Commons
import { BaseEntity } from '../../../common/entities/base.entity';

// Entities
import { User } from '../../user/entities/user.entity';

@Entity({ tableName: 'trainer_time_offs' })
export class TrainerTimeOff extends BaseEntity {
  @ManyToOne(() => User)
  trainer!: User;

  @Property()
  reason!: string;

  @Property()
  startTime!: Date;

  @Property()
  endTime!: Date;
}
