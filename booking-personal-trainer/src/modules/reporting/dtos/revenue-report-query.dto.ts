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
import { ReportingDtoSwagger } from '../constants/reporting-swagger-dto.constants';

export class RevenueReportQueryDto {
  @ApiPropertyOptional(
    ReportingDtoSwagger.RevenueReportQuery.ApiPropertyOptional.From,
  )
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  from?: Date;

  @ApiPropertyOptional(
    ReportingDtoSwagger.RevenueReportQuery.ApiPropertyOptional.To,
  )
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  to?: Date;

  @ApiPropertyOptional(
    ReportingDtoSwagger.RevenueReportQuery.ApiPropertyOptional.Currency,
  )
  @IsOptional()
  @IsString()
  @MaxLength(10)
  currency?: string;

  @ApiPropertyOptional(
    ReportingDtoSwagger.RevenueReportQuery.ApiPropertyOptional.Bucket,
  )
  @IsOptional()
  @IsEnum(ReportBucket)
  bucket?: ReportBucket;
}
