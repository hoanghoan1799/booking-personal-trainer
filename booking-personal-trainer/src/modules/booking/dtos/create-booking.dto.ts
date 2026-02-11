import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsDateString } from 'class-validator';
import {
  API_FORMATS,
  FIELD_DESCRIPTIONS,
} from '../../../common/constants/message.constant';

export class CreateBookingDto {
  @ApiProperty({
    description: FIELD_DESCRIPTIONS.BOOKING.TRAINER_ID,
    format: 'uuid',
  })
  @IsUUID()
  trainerId: string;

  @ApiProperty({
    description: FIELD_DESCRIPTIONS.BOOKING.START_TIME,
    format: API_FORMATS.DATE_TIME,
    example: '2024-12-25T10:00:00Z',
  })
  @IsDateString()
  startTime: string;

  @ApiProperty({
    description: FIELD_DESCRIPTIONS.BOOKING.END_TIME,
    format: API_FORMATS.DATE_TIME,
    example: '2024-12-25T11:00:00Z',
  })
  @IsDateString()
  endTime: string;
}
