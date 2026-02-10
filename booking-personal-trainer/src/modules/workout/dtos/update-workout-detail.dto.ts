import {
  IsEnum,
  IsOptional,
  IsArray,
  IsBoolean,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

// Commons
import { WorkoutStatus } from '../../../common/enums/workout/workout.enum';

class ExerciseCompletionDto {
  @IsString()
  workoutExerciseId!: string;

  @IsBoolean()
  isCompleted!: boolean;
}

export class UpdateWorkoutDetailDto {
  @IsOptional()
  @IsEnum(WorkoutStatus)
  status?: WorkoutStatus;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExerciseCompletionDto)
  exerciseCompletions?: ExerciseCompletionDto[];
}
