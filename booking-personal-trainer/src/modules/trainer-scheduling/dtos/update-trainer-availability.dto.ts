import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';

export class UpdateTrainerAvailabilityDto {
  @ApiPropertyOptional({ example: '2026-02-01T09:00:00Z' })
  @IsOptional()
  @IsDateString()
  startTime?: string;

  @ApiPropertyOptional({ example: '2026-02-01T10:00:00Z' })
  @IsOptional()
  @IsDateString()
  endTime?: string;
}
