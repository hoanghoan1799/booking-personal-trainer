import { Expose } from 'class-transformer';

// Commons
import { WorkoutStatus } from '../../../common/enums/workout/workout.enum';

export class ResponseWorkoutDto {
  @Expose()
  id: string;

  @Expose()
  status: WorkoutStatus;

  @Expose()
  startTime: Date;

  @Expose()
  endTime: Date;

  @Expose()
  totalExercises: number;

  @Expose()
  completedExercises: number;

  @Expose()
  progress?: string;
}
