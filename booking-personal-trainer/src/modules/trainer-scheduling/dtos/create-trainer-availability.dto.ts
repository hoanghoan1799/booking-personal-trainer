import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsInt, Max, Min } from 'class-validator';

export class CreateTrainerAvailabilityDto {
  @ApiProperty({ example: 1, description: 'Day of week (1-7).' })
  @IsInt()
  @Min(1)
  @Max(7)
  dayOfWeek: number;

  @ApiProperty({ example: '2026-02-01T09:00:00Z' })
  @IsDateString()
  startTime: string;

  @ApiProperty({ example: '2026-02-01T10:00:00Z' })
  @IsDateString()
  endTime: string;
}
