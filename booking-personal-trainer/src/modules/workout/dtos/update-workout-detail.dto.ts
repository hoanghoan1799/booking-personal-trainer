import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
import { FIELD_DESCRIPTIONS } from '../../../common/constants/message.constant';

export class ExerciseCompletionDto {
  @ApiProperty({
    description: FIELD_DESCRIPTIONS.WORKOUT.WORKOUT_EXERCISE_ID,
  })
  @IsString()
  workoutExerciseId!: string;

  @ApiProperty({
    description: FIELD_DESCRIPTIONS.WORKOUT.IS_COMPLETED,
  })
  @IsBoolean()
  isCompleted!: boolean;
}

export class UpdateWorkoutDetailDto {
  @ApiPropertyOptional({
    description: FIELD_DESCRIPTIONS.WORKOUT.STATUS,
    enum: WorkoutStatus,
  })
  @IsOptional()
  @IsEnum(WorkoutStatus)
  status?: WorkoutStatus;

  @ApiPropertyOptional({
    description: FIELD_DESCRIPTIONS.WORKOUT.EXERCISE_COMPLETIONS,
    type: [ExerciseCompletionDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExerciseCompletionDto)
  exerciseCompletions?: ExerciseCompletionDto[];
}
