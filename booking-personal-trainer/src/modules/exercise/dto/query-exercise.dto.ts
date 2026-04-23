import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

// Commons
import { BaseQueryDto } from '../../../common/dtos/base-query.dto';
import {
  Equipment,
  MuscleGroup,
} from '../../../common/enums/exercise/exercise.enum';

// Constants
import { ExerciseDtoSwagger } from '../constants/exercise-swagger-dto.constants';

export class ExercisesQueryDto extends BaseQueryDto {
  @ApiPropertyOptional(
    ExerciseDtoSwagger.ExercisesQuery.ApiPropertyOptional.MuscleGroup,
  )
  @IsOptional()
  @IsEnum(MuscleGroup)
  muscleGroup?: MuscleGroup;

  @ApiPropertyOptional(
    ExerciseDtoSwagger.ExercisesQuery.ApiPropertyOptional.Equipment,
  )
  @IsOptional()
  @IsEnum(Equipment)
  equipment?: Equipment;

  @ApiPropertyOptional(
    ExerciseDtoSwagger.ExercisesQuery.ApiPropertyOptional.Search,
  )
  @IsOptional()
  @IsString()
  search?: string;
}
