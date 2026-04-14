import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

// Commons
import {
  API_FORMATS,
  FIELD_DESCRIPTIONS,
} from '../../../common/constants/message.constant';

export class TrainerTimeOffResponseDto {
  @ApiProperty({
    description: FIELD_DESCRIPTIONS.USER.ID,
    format: API_FORMATS.UUID,
    example: FIELD_DESCRIPTIONS.USER.ID_EXAMPLE,
  })
  @Expose()
  id: string;

  @ApiProperty({ example: 'personal' })
  @Expose()
  reason: string;

  @ApiProperty({
    description: 'Time off start time.',
    format: API_FORMATS.DATE_TIME,
    type: Date,
  })
  @Expose()
  startTime: Date;

  @ApiProperty({
    description: 'Time off end time.',
    format: API_FORMATS.DATE_TIME,
    type: Date,
  })
  @Expose()
  endTime: Date;

  @ApiPropertyOptional({
    description: FIELD_DESCRIPTIONS.BOOKING.CREATED_AT,
  })
  @Expose()
  createdAt?: Date;

  @ApiPropertyOptional({
    description: FIELD_DESCRIPTIONS.BOOKING.UPDATED_AT,
  })
  @Expose()
  updatedAt?: Date;
}
