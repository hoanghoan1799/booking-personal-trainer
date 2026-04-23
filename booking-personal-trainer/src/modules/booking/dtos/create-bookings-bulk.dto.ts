import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString, IsUUID, Matches } from 'class-validator';

import { BookingDtoSwagger } from '../constants/booking-swagger-dto.constants';

const PERIOD_VALUES = ['day', 'week', 'month', 'year'] as const;

export type BookingBulkPeriod = (typeof PERIOD_VALUES)[number];

export class CreateBookingsBulkDto {
  @ApiProperty(BookingDtoSwagger.CreateBookingsBulk.ApiProperty.TrainerId)
  @IsUUID()
  trainerId: string;

  @ApiProperty(BookingDtoSwagger.CreateBookingsBulk.ApiProperty.StartDate)
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  startDate: string;

  @ApiProperty(BookingDtoSwagger.CreateBookingsBulk.ApiProperty.StartClockTime)
  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  startClockTime: string;

  @ApiProperty(BookingDtoSwagger.CreateBookingsBulk.ApiProperty.EndClockTime)
  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  endClockTime: string;

  @ApiProperty(BookingDtoSwagger.CreateBookingsBulk.ApiProperty.Period)
  @IsIn(PERIOD_VALUES)
  period: BookingBulkPeriod;
}
