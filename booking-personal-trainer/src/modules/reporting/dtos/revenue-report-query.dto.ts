import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

import { ReportBucket } from '../enums/report-bucket.enum';

export class RevenueReportQueryDto {
  @ApiPropertyOptional({
    description:
      'Filter payments by paidAt/refundedAt from this time (inclusive).',
    example: '2026-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  from?: Date;

  @ApiPropertyOptional({
    description:
      'Filter payments by paidAt/refundedAt up to this time (exclusive).',
    example: '2026-04-01T00:00:00.000Z',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  to?: Date;

  @ApiPropertyOptional({
    description: 'Optional currency filter (e.g. USD).',
    example: 'USD',
  })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  currency?: string;

  @ApiPropertyOptional({
    enum: ReportBucket,
    description: 'Calendar bucket size (UTC).',
    default: ReportBucket.MONTH,
  })
  @IsOptional()
  @IsEnum(ReportBucket)
  bucket?: ReportBucket;
}
