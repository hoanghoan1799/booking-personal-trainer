import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';

// Commons
import {
  Equipment,
  MuscleGroup,
} from '../../../common/enums/exercise/exercise.enum';

// Constants
import { ExerciseDtoSwagger } from '../constants/exercise-swagger-dto.constants';

export class CreateExerciseDto {
  @ApiProperty(ExerciseDtoSwagger.CreateExercise.ApiProperty.Name)
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional(
    ExerciseDtoSwagger.CreateExercise.ApiPropertyOptional.Description,
  )
  @IsString()
  @IsOptional()
  description!: string;

  @ApiProperty(ExerciseDtoSwagger.CreateExercise.ApiProperty.MuscleGroup)
  @IsEnum(MuscleGroup)
  muscleGroup!: MuscleGroup;

  @ApiProperty(ExerciseDtoSwagger.CreateExercise.ApiProperty.Equipment)
  @IsEnum(Equipment)
  equipment!: Equipment;

  @ApiPropertyOptional(
    ExerciseDtoSwagger.CreateExercise.ApiPropertyOptional.ThumbnailUrl,
  )
  @IsUrl()
  @IsOptional()
  thumbnailUrl?: string;

  @ApiPropertyOptional(
    ExerciseDtoSwagger.CreateExercise.ApiPropertyOptional.VideoUrl,
  )
  @IsUrl()
  @IsOptional()
  videoUrl?: string;

  @ApiPropertyOptional(
    ExerciseDtoSwagger.CreateExercise.ApiPropertyOptional.IsDeleted,
  )
  @IsOptional()
  @IsBoolean()
  isDeleted?: boolean;
}
