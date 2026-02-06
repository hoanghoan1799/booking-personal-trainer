import { IsEnum, IsOptional, IsString } from 'class-validator';

// Commons
import { BaseQueryDto } from '../../../common/dtos/base-query.dto';
import {
  Equipment,
  MuscleGroup,
} from '../../../common/enums/exercise/exercise.enum';

export class ExercisesQueryDto extends BaseQueryDto {
  @IsOptional()
  @IsEnum(MuscleGroup)
  muscleGroup?: MuscleGroup;

  @IsOptional()
  @IsEnum(Equipment)
  equipment?: Equipment;

  @IsOptional()
  @IsString()
  search?: string;
}
