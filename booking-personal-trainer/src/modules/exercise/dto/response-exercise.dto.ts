import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import {
  Equipment,
  MuscleGroup,
} from '../../../common/enums/exercise/exercise.enum';
import {
  API_FORMATS,
  FIELD_DESCRIPTIONS,
} from '../../../common/constants/message.constant';

export class ResponseExerciseDto {
  @ApiProperty({
    description: FIELD_DESCRIPTIONS.EXERCISE.ID,
    example: FIELD_DESCRIPTIONS.USER.ID_EXAMPLE,
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: FIELD_DESCRIPTIONS.EXERCISE.NAME,
  })
  @Expose()
  name: string;

  @ApiPropertyOptional({
    description: FIELD_DESCRIPTIONS.EXERCISE.DESCRIPTION,
  })
  @Expose()
  description: string;

  @ApiPropertyOptional({
    description: FIELD_DESCRIPTIONS.EXERCISE.THUMBNAIL_URL,
    format: API_FORMATS.URI,
  })
  @Expose()
  thumbnailUrl?: string;

  @ApiPropertyOptional({
    description: FIELD_DESCRIPTIONS.EXERCISE.VIDEO_URL,
    format: API_FORMATS.URI,
  })
  @Expose()
  videoUrl?: string;

  @ApiProperty({
    description: FIELD_DESCRIPTIONS.EXERCISE.MUSCLE_GROUP,
    enum: MuscleGroup,
  })
  @Expose()
  muscleGroup: MuscleGroup;

  @ApiProperty({
    description: FIELD_DESCRIPTIONS.EXERCISE.EQUIPMENT,
    enum: Equipment,
  })
  @Expose()
  equipment: Equipment;
}
