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

import { ReportingDtoSwagger } from '../constants/reporting-swagger-dto.constants';

export class TrainerKpiQueryDto {
  @ApiPropertyOptional(
    ReportingDtoSwagger.TrainerKpiQuery.ApiPropertyOptional.From,
  )
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  from?: Date;

  @ApiPropertyOptional(
    ReportingDtoSwagger.TrainerKpiQuery.ApiPropertyOptional.To,
  )
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  to?: Date;

  @ApiPropertyOptional(
    ReportingDtoSwagger.TrainerKpiQuery.ApiPropertyOptional.Limit,
  )
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;

  @ApiPropertyOptional(
    ReportingDtoSwagger.TrainerKpiQuery.ApiPropertyOptional.Currency,
  )
  @IsOptional()
  @IsString()
  @MaxLength(10)
  currency?: string;
}
