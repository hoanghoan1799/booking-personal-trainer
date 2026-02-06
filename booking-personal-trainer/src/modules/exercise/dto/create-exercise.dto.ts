import {
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

export class CreateExerciseDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  description!: string;

  @IsEnum(MuscleGroup)
  muscleGroup!: MuscleGroup;

  @IsEnum(Equipment)
  equipment!: Equipment;

  @IsUrl()
  @IsOptional()
  thumbnailUrl?: string;

  @IsUrl()
  @IsOptional()
  videoUrl?: string;
}
