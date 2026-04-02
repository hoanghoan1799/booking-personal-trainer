import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import {
  API_FORMATS,
  FIELD_DESCRIPTIONS,
} from '../../../common/constants/message.constant';

export class ExerciseResponseDto {
  @ApiProperty({
    description: FIELD_DESCRIPTIONS.EXERCISE.ID,
    format: API_FORMATS.UUID,
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
  description?: string;

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
  })
  @Expose()
  muscleGroup: string;

  @ApiProperty({
    description: FIELD_DESCRIPTIONS.EXERCISE.EQUIPMENT,
  })
  @Expose()
  equipment: string;
}
