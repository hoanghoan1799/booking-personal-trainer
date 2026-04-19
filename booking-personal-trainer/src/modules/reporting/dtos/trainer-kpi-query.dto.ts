import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class TrainerKpiQueryDto {
  @ApiPropertyOptional({
    description:
      'Filter bookings/workouts by startTime from this time (inclusive).',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  from?: Date;

  @ApiPropertyOptional({
    description:
      'Filter bookings/workouts by startTime up to this time (exclusive).',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  to?: Date;

  @ApiPropertyOptional({
    description: 'Max leaderboard rows (admin).',
    default: 50,
    minimum: 1,
    maximum: 200,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;

  @ApiPropertyOptional({
    description:
      'When set, trainer share revenue sums only payments in this currency.',
    example: 'USD',
  })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  currency?: string;
}
