import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsInt, IsOptional, IsUUID, Min } from 'class-validator';

export class GetAvailableSlotsQueryDto {
  @IsUUID()
  trainerId: string;

  @IsDateString()
  rangeStart: string;

  @IsDateString()
  rangeEnd: string;

  @ApiPropertyOptional({ description: 'Slot duration in minutes (default 60)' })
  @IsOptional()
  @IsInt()
  @Min(60)
  durationMinutes?: number;

  @ApiPropertyOptional({ description: 'Slot step in minutes (default 30)' })
  @IsOptional()
  @IsInt()
  @Min(30)
  stepMinutes?: number;
}
