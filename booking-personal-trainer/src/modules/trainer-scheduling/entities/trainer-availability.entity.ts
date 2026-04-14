import { Entity, ManyToOne, Property } from '@mikro-orm/core';

// Commons
import { BaseEntity } from '../../../common/entities/base.entity';

// Entities
import { User } from '../../user/entities/user.entity';

@Entity({ tableName: 'trainer_availabilities' })
export class TrainerAvailability extends BaseEntity {
  @ManyToOne(() => User)
  trainer!: User;

  @Property()
  dayOfWeek!: number;

  @Property()
  startTime!: Date;

  @Property()
  endTime!: Date;
}
