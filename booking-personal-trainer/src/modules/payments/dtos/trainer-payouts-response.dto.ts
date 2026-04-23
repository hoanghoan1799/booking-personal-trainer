import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsInt, IsObject, IsString } from 'class-validator';

import { PaymentsDtoSwagger } from '../constants/payments-swagger-dto.constants';

export class TrainerPayoutsCurrencySummaryDto {
  @ApiProperty()
  @IsString()
  currency!: string;

  @ApiProperty(
    PaymentsDtoSwagger.TrainerPayoutsCurrencySummary.ApiProperty
      .PaidTrainerShareCents,
  )
  @IsInt()
  paidTrainerShareCents!: number;

  @ApiProperty(
    PaymentsDtoSwagger.TrainerPayoutsCurrencySummary.ApiProperty
      .RefundedTrainerShareCents,
  )
  @IsInt()
  refundedTrainerShareCents!: number;

  @ApiProperty(
    PaymentsDtoSwagger.TrainerPayoutsCurrencySummary.ApiProperty
      .NetTrainerShareCents,
  )
  @IsInt()
  netTrainerShareCents!: number;

  @ApiProperty(
    PaymentsDtoSwagger.TrainerPayoutsCurrencySummary.ApiProperty
      .PayoutStatusCounts,
  )
  @IsObject()
  payoutStatusCounts!: Record<string, number>;

  @ApiProperty(
    PaymentsDtoSwagger.TrainerPayoutsCurrencySummary.ApiProperty.IsEstimated,
  )
  @IsBoolean()
  isEstimated!: boolean;
}

export class TrainerPayoutsTransferRowDto {
  @ApiProperty()
  @IsString()
  paymentId!: string;

  @ApiProperty()
  @IsString()
  currency!: string;

  @ApiProperty()
  @IsString()
  status!: string;

  @ApiProperty()
  @IsInt()
  trainerShareCents!: number;

  @ApiProperty(
    PaymentsDtoSwagger.TrainerPayoutsTransferRow.ApiProperty.TransferId,
  )
  @IsString()
  transferId!: string | null;

  @ApiProperty(
    PaymentsDtoSwagger.TrainerPayoutsTransferRow.ApiProperty.ErrorMessage,
  )
  @IsString()
  errorMessage!: string | null;
}

export class TrainerPayoutsResponseDto {
  @ApiProperty(
    PaymentsDtoSwagger.TrainerPayoutsResponse.ApiProperty.Summary(
      TrainerPayoutsCurrencySummaryDto,
    ),
  )
  @IsArray()
  summary!: TrainerPayoutsCurrencySummaryDto[];

  @ApiProperty(
    PaymentsDtoSwagger.TrainerPayoutsResponse.ApiProperty.Rows(
      TrainerPayoutsTransferRowDto,
    ),
  )
  @IsArray()
  rows!: TrainerPayoutsTransferRowDto[];
}
