import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsDateString } from 'class-validator';
import {
  API_FORMATS,
  FIELD_DESCRIPTIONS,
} from '../../../common/constants/message.constant';

export class CreateBookingDto {
  @ApiProperty({
    description: FIELD_DESCRIPTIONS.BOOKING.TRAINER_ID,
    format: API_FORMATS.UUID,
    example: FIELD_DESCRIPTIONS.USER.ID_EXAMPLE,
  })
  @IsUUID()
  trainerId: string;

  @ApiProperty({
    description: FIELD_DESCRIPTIONS.BOOKING.START_TIME,
    format: API_FORMATS.DATE_TIME,
    example: FIELD_DESCRIPTIONS.COMMON.DATE_TIME_START_EXAMPLE,
  })
  @IsDateString()
  startTime: string;

  @ApiProperty({
    description: FIELD_DESCRIPTIONS.BOOKING.END_TIME,
    format: API_FORMATS.DATE_TIME,
    example: FIELD_DESCRIPTIONS.COMMON.DATE_TIME_END_EXAMPLE,
  })
  @IsDateString()
  endTime: string;
}
