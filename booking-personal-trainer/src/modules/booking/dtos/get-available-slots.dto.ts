import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsInt, IsOptional, IsUUID, Min } from 'class-validator';

import { BookingDtoSwagger } from '../constants/booking-swagger-dto.constants';

export class GetAvailableSlotsQueryDto {
  @IsUUID()
  trainerId: string;

  @IsDateString()
  rangeStart: string;

  @IsDateString()
  rangeEnd: string;

  @ApiPropertyOptional(
    BookingDtoSwagger.GetAvailableSlotsQuery.ApiPropertyOptional
      .DurationMinutes,
  )
  @IsOptional()
  @IsInt()
  @Min(60)
  durationMinutes?: number;

  @ApiPropertyOptional(
    BookingDtoSwagger.GetAvailableSlotsQuery.ApiPropertyOptional.StepMinutes,
  )
  @IsOptional()
  @IsInt()
  @Min(30)
  stepMinutes?: number;
}
