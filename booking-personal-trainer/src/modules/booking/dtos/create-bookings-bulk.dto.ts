import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString, IsUUID, Matches } from 'class-validator';

const PERIOD_VALUES = ['day', 'week', 'month', 'year'] as const;

export type BookingBulkPeriod = (typeof PERIOD_VALUES)[number];

export class CreateBookingsBulkDto {
  @ApiProperty({
    description: 'Trainer id',
    format: 'uuid',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  })
  @IsUUID()
  trainerId: string;

  @ApiProperty({
    description: 'Start date for the series (YYYY-MM-DD)',
    format: 'date',
    example: '2026-04-21',
  })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  startDate: string;

  @ApiProperty({
    description: 'Start clock time (HH:mm)',
    example: '09:00',
  })
  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  startClockTime: string;

  @ApiProperty({
    description: 'End clock time (HH:mm)',
    example: '10:00',
  })
  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  endClockTime: string;

  @ApiProperty({
    description: 'Period',
    enum: PERIOD_VALUES,
    example: 'week',
  })
  @IsIn(PERIOD_VALUES)
  period: BookingBulkPeriod;
}
