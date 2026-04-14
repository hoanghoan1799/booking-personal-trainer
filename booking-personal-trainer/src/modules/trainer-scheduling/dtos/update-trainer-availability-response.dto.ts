import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

// Commons
import {
  API_FORMATS,
  FIELD_DESCRIPTIONS,
} from '../../../common/constants/message.constant';

export class UpdateTrainerAvailabilityResponseDto {
  @ApiProperty({
    description: FIELD_DESCRIPTIONS.USER.ID,
    format: API_FORMATS.UUID,
    example: FIELD_DESCRIPTIONS.USER.ID_EXAMPLE,
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'Day of week (1-7).',
    example: 1,
  })
  @Expose()
  dayOfWeek: number;

  @ApiProperty({
    description: 'Availability start time.',
    format: API_FORMATS.DATE_TIME,
    type: Date,
  })
  @Expose()
  startTime: Date;

  @ApiProperty({
    description: 'Availability end time.',
    format: API_FORMATS.DATE_TIME,
    type: Date,
  })
  @Expose()
  endTime: Date;

  @ApiPropertyOptional({
    description: FIELD_DESCRIPTIONS.BOOKING.UPDATED_AT,
  })
  @Expose()
  updatedAt?: Date;
}
