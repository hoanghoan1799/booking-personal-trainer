import { Expose } from 'class-transformer';

// DTOs
import { WorkoutStatus } from '../../../common/enums/workout/workout.enum';
import { ExerciseResponseDto } from '../../../modules/exercise/dto/exercise-response.dto';
import { ResponseUserDto } from '../../../modules/user/dtos/response-user.dto';

export class WorkoutExerciseResponseDto {
  order: number;
  isCompleted: boolean;
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

  @Expose()
  exercises: WorkoutExerciseResponseDto[];

  @Expose()
  totalExercises: number;

  @Expose()
  completedExercises: number;

  @Expose()
  createdAt?: Date;

  @Expose()
  updatedAt?: Date;
}
