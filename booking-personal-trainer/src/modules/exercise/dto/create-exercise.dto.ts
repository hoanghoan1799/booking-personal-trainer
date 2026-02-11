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
import {
  API_FORMATS,
  FIELD_DESCRIPTIONS,
} from '../../../common/constants/message.constant';

export class CreateExerciseDto {
  @ApiProperty({
    description: FIELD_DESCRIPTIONS.EXERCISE.NAME,
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({
    description: FIELD_DESCRIPTIONS.EXERCISE.DESCRIPTION,
  })
  @IsString()
  @IsOptional()
  description!: string;

  @ApiProperty({
    description: FIELD_DESCRIPTIONS.EXERCISE.MUSCLE_GROUP,
    enum: MuscleGroup,
  })
  @IsEnum(MuscleGroup)
  muscleGroup!: MuscleGroup;

  @ApiProperty({
    description: FIELD_DESCRIPTIONS.EXERCISE.EQUIPMENT,
    enum: Equipment,
  })
  @IsEnum(Equipment)
  equipment!: Equipment;

  @ApiPropertyOptional({
    description: FIELD_DESCRIPTIONS.EXERCISE.THUMBNAIL_URL,
    format: API_FORMATS.URI,
  })
  @IsUrl()
  @IsOptional()
  thumbnailUrl?: string;

  @ApiPropertyOptional({
    description: FIELD_DESCRIPTIONS.EXERCISE.VIDEO_URL,
    format: API_FORMATS.URI,
  })
  @IsUrl()
  @IsOptional()
  videoUrl?: string;

  @ApiPropertyOptional({
    description: FIELD_DESCRIPTIONS.EXERCISE.IS_DELETED,
  })
  @IsOptional()
  @IsBoolean()
  isDeleted?: boolean;
}
