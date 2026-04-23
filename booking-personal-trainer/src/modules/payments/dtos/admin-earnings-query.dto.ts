import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsOptional, IsString, MaxLength } from 'class-validator';

import { PaymentsDtoSwagger } from '../constants/payments-swagger-dto.constants';

export class AdminEarningsQueryDto {
  @ApiPropertyOptional(
    PaymentsDtoSwagger.AdminEarningsQuery.ApiPropertyOptional.From,
  )
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  from?: Date;

  @ApiPropertyOptional(
    PaymentsDtoSwagger.AdminEarningsQuery.ApiPropertyOptional.To,
  )
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  to?: Date;

  @ApiPropertyOptional(
    PaymentsDtoSwagger.AdminEarningsQuery.ApiPropertyOptional.Currency,
  )
  @IsOptional()
  @IsString()
  @MaxLength(10)
  currency?: string;
}
