import { Entity, Property, Enum, ManyToOne } from '@mikro-orm/core';
// Commons
import { BaseEntity } from '../../../common/entities/base.entity';
import { WorkoutStatus } from '../../../common/enums/workout/workout.enum';

// Entities
import { User } from '../../../modules/user/entities/user.entity';

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

  @Property({ default: 0 })
  totalExercises!: number;

  @Property({ default: 0 })
  completedExercises!: number;

  @Property({ nullable: true })
  progress?: string;
}
