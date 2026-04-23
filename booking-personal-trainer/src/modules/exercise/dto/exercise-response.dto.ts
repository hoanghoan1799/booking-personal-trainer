import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

// Constants
import { ExerciseDtoSwagger } from '../constants/exercise-swagger-dto.constants';

export class ExerciseResponseDto {
  @ApiProperty(ExerciseDtoSwagger.ExerciseResponse.ApiProperty.Id)
  @Expose()
  id: string;

  @ApiProperty(ExerciseDtoSwagger.ExerciseResponse.ApiProperty.Name)
  @Expose()
  name: string;

  @ApiPropertyOptional(
    ExerciseDtoSwagger.ExerciseResponse.ApiPropertyOptional.Description,
  )
  @Expose()
  description?: string;

  @ApiPropertyOptional(
    ExerciseDtoSwagger.ExerciseResponse.ApiPropertyOptional.ThumbnailUrl,
  )
  @Expose()
  thumbnailUrl?: string;

  @ApiPropertyOptional(
    ExerciseDtoSwagger.ExerciseResponse.ApiPropertyOptional.VideoUrl,
  )
  @Expose()
  videoUrl?: string;

  @ApiProperty(ExerciseDtoSwagger.ExerciseResponse.ApiProperty.MuscleGroup)
  @Expose()
  muscleGroup: string;

  @ApiProperty(ExerciseDtoSwagger.ExerciseResponse.ApiProperty.Equipment)
  @Expose()
  equipment: string;
}
