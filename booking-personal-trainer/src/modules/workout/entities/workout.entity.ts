import { Entity, Property, Enum, ManyToOne, Index } from '@mikro-orm/core';

// Commons
import { BaseEntity } from '../../../common/entities/base.entity';
import { WorkoutStatus } from '../../../common/enums/workout/workout.enum';

// Entities
import { User } from '../../../modules/user/entities/user.entity';

@Index({ properties: ['trainer', 'isDeleted'] })
@Index({ properties: ['trainee', 'isDeleted'] })
@Index({ properties: ['startTime'] })
@Entity({ tableName: 'workouts' })
export class Workout extends BaseEntity {
  @ManyToOne(() => User)
  trainer!: User;

  @ManyToOne(() => User)
  trainee!: User;

  @Enum(() => WorkoutStatus)
  status: WorkoutStatus = WorkoutStatus.PENDING;

  @Property()
  startTime!: Date;

  @Property()
  endTime!: Date;

  @Property({ default: false })
  isDeleted?: boolean;

  @Property({ nullable: true })
  deletedAt?: Date | null;
}
