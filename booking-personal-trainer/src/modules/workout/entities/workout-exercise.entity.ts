import { Entity, Property, ManyToOne, Index } from '@mikro-orm/core';

// Entities
import { Exercise } from '../../exercise/entities/exercise.entity';
import { Workout } from './workout.entity';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity({ tableName: 'workout_exercises' })
@Index({ properties: ['workout', 'isDeleted'] })
export class WorkoutExercise extends BaseEntity {
  @ManyToOne(() => Workout)
  workout!: Workout;

  @ManyToOne(() => Exercise)
  exercise!: Exercise;

  @Property()
  order!: number;

  @Property({ default: false })
  isCompleted = false;

  @Property({ nullable: true })
  completedAt?: Date;

  @Property({ default: false })
  isDeleted = false;
}
