import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsOptional, IsString, MaxLength } from 'class-validator';

export class TrainerPayoutsQueryDto {
  @ApiPropertyOptional({
    description: 'Filter payments paid/refunded from this time (inclusive).',
    example: '2026-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  from?: Date;

  @ApiPropertyOptional({
    description: 'Filter payments paid/refunded up to this time (exclusive).',
    example: '2026-02-01T00:00:00.000Z',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  to?: Date;

  @ApiPropertyOptional({
    description:
      'Optional currency filter (e.g. USD). When omitted, returns groups per currency.',
    example: 'USD',
  })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  currency?: string;
}
