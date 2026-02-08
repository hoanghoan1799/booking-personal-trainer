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
  id: string;
  startTime: Date;
  endTime: Date;
  status: WorkoutStatus;

  trainer: ResponseUserDto;
  trainee: ResponseUserDto;

  exercises: WorkoutExerciseResponseDto[];

  totalExercises: number;
  completedExercises: number;

  createdAt?: Date;
  updatedAt?: Date;
}
