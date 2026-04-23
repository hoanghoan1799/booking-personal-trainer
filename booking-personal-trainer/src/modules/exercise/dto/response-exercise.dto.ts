import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import {
  Equipment,
  MuscleGroup,
} from '../../../common/enums/exercise/exercise.enum';

// Constants
import { ExerciseDtoSwagger } from '../constants/exercise-swagger-dto.constants';

export class ResponseExerciseDto {
  @ApiProperty(ExerciseDtoSwagger.ResponseExercise.ApiProperty.Id)
  @Expose()
  id: string;

  @ApiProperty(ExerciseDtoSwagger.ResponseExercise.ApiProperty.Name)
  @Expose()
  name: string;

  @ApiPropertyOptional(
    ExerciseDtoSwagger.ResponseExercise.ApiPropertyOptional.Description,
  )
  @Expose()
  description: string;

  @ApiPropertyOptional(
    ExerciseDtoSwagger.ResponseExercise.ApiPropertyOptional.ThumbnailUrl,
  )
  @Expose()
  thumbnailUrl?: string;

  @ApiPropertyOptional(
    ExerciseDtoSwagger.ResponseExercise.ApiPropertyOptional.VideoUrl,
  )
  @Expose()
  videoUrl?: string;

  @ApiProperty(ExerciseDtoSwagger.ResponseExercise.ApiProperty.MuscleGroup)
  @Expose()
  muscleGroup: MuscleGroup;

  @ApiProperty(ExerciseDtoSwagger.ResponseExercise.ApiProperty.Equipment)
  @Expose()
  equipment: Equipment;
}
