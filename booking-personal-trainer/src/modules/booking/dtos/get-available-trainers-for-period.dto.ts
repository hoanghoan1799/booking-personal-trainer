import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString, Matches } from 'class-validator';

import { BookingDtoSwagger } from '../constants/booking-swagger-dto.constants';

const PERIOD_VALUES = ['week', 'month', 'year'] as const;

export type BookingPeriod = (typeof PERIOD_VALUES)[number];

export class GetAvailableTrainersForPeriodQueryDto {
  @ApiProperty(
    BookingDtoSwagger.GetAvailableTrainersForPeriodQuery.ApiProperty.StartDate,
  )
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  startDate: string;

  @ApiProperty(
    BookingDtoSwagger.GetAvailableTrainersForPeriodQuery.ApiProperty
      .StartClockTime,
  )
  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  startClockTime: string;

  @ApiProperty(
    BookingDtoSwagger.GetAvailableTrainersForPeriodQuery.ApiProperty
      .EndClockTime,
  )
  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  endClockTime: string;

  @ApiProperty(
    BookingDtoSwagger.GetAvailableTrainersForPeriodQuery.ApiProperty.Period,
  )
  @IsIn(PERIOD_VALUES)
  period: BookingPeriod;
}
