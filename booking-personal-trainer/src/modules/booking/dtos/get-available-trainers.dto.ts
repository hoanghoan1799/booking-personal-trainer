import { ApiProperty } from '@nestjs/swagger';
import { IsDateString } from 'class-validator';

import {
  API_FORMATS,
  FIELD_DESCRIPTIONS,
} from '../../../common/constants/message.constant';

export class GetAvailableTrainersQueryDto {
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
