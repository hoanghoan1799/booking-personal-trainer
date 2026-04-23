import { ApiProperty } from '@nestjs/swagger';
import { IsDateString } from 'class-validator';

import { BookingDtoSwagger } from '../constants/booking-swagger-dto.constants';

export class GetAvailableTrainersQueryDto {
  @ApiProperty(
    BookingDtoSwagger.GetAvailableTrainersQuery.ApiProperty.StartTime,
  )
  @IsDateString()
  startTime: string;

  @ApiProperty(BookingDtoSwagger.GetAvailableTrainersQuery.ApiProperty.EndTime)
  @IsDateString()
  endTime: string;
}
