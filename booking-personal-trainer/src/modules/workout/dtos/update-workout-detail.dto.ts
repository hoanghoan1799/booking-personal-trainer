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
import { WorkoutDtoSwagger } from '../constants/workout-swagger-dto.constants';

export class ExerciseCompletionDto {
  @ApiProperty(
    WorkoutDtoSwagger.UpdateWorkoutDetail.ApiProperty.WorkoutExerciseId,
  )
  @IsString()
  workoutExerciseId!: string;

  @ApiProperty(WorkoutDtoSwagger.UpdateWorkoutDetail.ApiProperty.IsCompleted)
  @IsBoolean()
  isCompleted!: boolean;
}

export class UpdateWorkoutDetailDto {
  @ApiPropertyOptional(
    WorkoutDtoSwagger.UpdateWorkoutDetail.ApiPropertyOptional.Status,
  )
  @IsOptional()
  @IsEnum(WorkoutStatus)
  status?: WorkoutStatus;

  @ApiPropertyOptional(
    WorkoutDtoSwagger.UpdateWorkoutDetail.ApiPropertyOptional.ExerciseCompletions(
      ExerciseCompletionDto,
    ),
  )
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExerciseCompletionDto)
  exerciseCompletions?: ExerciseCompletionDto[];
}
