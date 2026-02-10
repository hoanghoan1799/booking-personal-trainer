import { Expose, Type } from 'class-transformer';

// DTOs
import { WorkoutStatus } from '../../../common/enums/workout/workout.enum';
import { ExerciseResponseDto } from '../../exercise/dto/exercise-response.dto';
import { ResponseUserDto } from '../../user/dtos/response-user.dto';
import { Collection } from '@mikro-orm/core';

export class WorkoutExerciseResponseDto {
  @Expose()
  id: string;

  @Expose()
  order: number;

  @Expose()
  isCompleted: boolean;

  @Expose()
  exercise: ExerciseResponseDto;
}

export class WorkoutResponseDto {
  @Expose()
  id: string;

  @Expose()
  startTime: Date;

  @Expose()
  endTime: Date;

  @Expose()
  status: WorkoutStatus;

  @Expose()
  trainer: ResponseUserDto;

  @Expose()
  trainee: ResponseUserDto;

  // TODO: Need to be refactor type
  @Expose()
  @Type(() => WorkoutExerciseResponseDto)
  exercises: WorkoutExerciseResponseDto[] | Collection<any>;

  @Expose()
  totalExercises?: number;

  @Expose()
  completedExercises?: number;

  @Expose()
  createdAt?: Date;

  @Expose()
  updatedAt?: Date;
}
