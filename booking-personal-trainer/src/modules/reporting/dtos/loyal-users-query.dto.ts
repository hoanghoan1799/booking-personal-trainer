import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsInt, IsOptional, Max, Min } from 'class-validator';

import { ReportingDtoSwagger } from '../constants/reporting-swagger-dto.constants';

export class LoyalUsersQueryDto {
  @ApiPropertyOptional(
    ReportingDtoSwagger.LoyalUsersQuery.ApiPropertyOptional.From,
  )
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  from?: Date;

  @ApiPropertyOptional(
    ReportingDtoSwagger.LoyalUsersQuery.ApiPropertyOptional.To,
  )
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  to?: Date;

  @ApiPropertyOptional(
    ReportingDtoSwagger.LoyalUsersQuery.ApiPropertyOptional.Limit,
  )
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;
}
