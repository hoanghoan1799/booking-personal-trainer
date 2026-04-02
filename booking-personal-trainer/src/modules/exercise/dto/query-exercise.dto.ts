import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

// Commons
import { BaseQueryDto } from '../../../common/dtos/base-query.dto';
import {
  Equipment,
  MuscleGroup,
} from '../../../common/enums/exercise/exercise.enum';
import { FIELD_DESCRIPTIONS } from '../../../common/constants/message.constant';

export class ExercisesQueryDto extends BaseQueryDto {
  @ApiPropertyOptional({
    description: FIELD_DESCRIPTIONS.QUERY.MUSCLE_GROUP_FILTER,
    enum: MuscleGroup,
  })
  @IsOptional()
  @IsEnum(MuscleGroup)
  muscleGroup?: MuscleGroup;

  @ApiPropertyOptional({
    description: FIELD_DESCRIPTIONS.QUERY.EQUIPMENT_FILTER,
    enum: Equipment,
  })
  @IsOptional()
  @IsEnum(Equipment)
  equipment?: Equipment;

  @ApiPropertyOptional({
    description: FIELD_DESCRIPTIONS.QUERY.EXERCISE_SEARCH,
  })
  @IsOptional()
  @IsString()
  search?: string;
}
