import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString, Matches } from 'class-validator';

const PERIOD_VALUES = ['week', 'month', 'year'] as const;

export type BookingPeriod = (typeof PERIOD_VALUES)[number];

export class GetAvailableTrainersForPeriodQueryDto {
  @ApiProperty({
    description:
      'Start date (rolling period starts from this date) in YYYY-MM-DD',
    format: 'date',
    example: '2026-04-21',
  })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  startDate: string;

  @ApiProperty({
    description: 'Start clock time in HH:mm (30-minute step)',
    example: '09:00',
  })
  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  startClockTime: string;

  @ApiProperty({
    description: 'End clock time in HH:mm (30-minute step)',
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
  period: BookingPeriod;
}
