import {
  Entity,
  Property,
  Enum,
  ManyToOne,
  Index,
  Collection,
  OneToMany,
} from '@mikro-orm/core';

// Commons
import { BaseEntity } from '../../../common/entities/base.entity';
import { WorkoutStatus } from '../../../common/enums/workout/workout.enum';

// Entities
import { User } from '../../../modules/user/entities/user.entity';
import { WorkoutExercise } from './workout-exercise.entity';
import { Booking } from '../../booking/entities/booking.entity';
import { ExerciseTemplate } from '../../templates/entities/exercise-template.entity';
import { Expose } from 'class-transformer';

@Index({ properties: ['trainer', 'isDeleted'] })
@Index({ properties: ['trainee', 'isDeleted'] })
@Index({ properties: ['startTime'] })
@Entity({ tableName: 'workouts' })
export class Workout extends BaseEntity {
  @Expose()
  @ManyToOne(() => Booking, { nullable: true })
  booking?: Booking | null;

  @Expose()
  @ManyToOne(() => User)
  trainer!: User;

  @Expose()
  @ManyToOne(() => User)
  trainee!: User;

  @Expose()
  @ManyToOne(() => ExerciseTemplate, { nullable: true })
  template?: ExerciseTemplate | null;

  @Expose()
  @OneToMany(() => WorkoutExercise, (we) => we.workout, { orphanRemoval: true })
  exercises = new Collection<WorkoutExercise>(this);

  @Expose()
  @Enum(() => WorkoutStatus)
  status: WorkoutStatus = WorkoutStatus.PENDING;

  @Expose()
  @Property()
  startTime!: Date;

  @Expose()
  @Property()
  endTime!: Date;

  @Expose()
  @Property({ default: false })
  isDeleted?: boolean;

  @Expose()
  @Property({ nullable: true })
  deletedAt?: Date | null;
}
