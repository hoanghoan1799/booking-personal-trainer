import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

import { PaymentsDtoSwagger } from '../constants/payments-swagger-dto.constants';

export class WorkoutPaymentAccessResponseDto {
  @ApiProperty(
    PaymentsDtoSwagger.WorkoutPaymentAccessResponse.ApiProperty.IsPaid,
  )
  @IsBoolean()
  isPaid!: boolean;

  @ApiProperty(PaymentsDtoSwagger.WorkoutPaymentAccessResponse.ApiProperty.View)
  @IsString()
  view!: 'LIMITED' | 'FULL';

  @ApiPropertyOptional(
    PaymentsDtoSwagger.WorkoutPaymentAccessResponse.ApiPropertyOptional
      .BillingChargeId,
  )
  @IsOptional()
  @IsUUID()
  billingChargeId?: string | null;

  @ApiPropertyOptional(
    PaymentsDtoSwagger.WorkoutPaymentAccessResponse.ApiPropertyOptional
      .AmountCents,
  )
  @IsOptional()
  @IsInt()
  amountCents?: number | null;

  @ApiPropertyOptional(
    PaymentsDtoSwagger.WorkoutPaymentAccessResponse.ApiPropertyOptional
      .Currency,
  )
  @IsOptional()
  @IsString()
  currency?: string | null;
}
