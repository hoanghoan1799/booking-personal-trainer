import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsInt, IsObject, IsString } from 'class-validator';

import { PaymentsDtoSwagger } from '../constants/payments-swagger-dto.constants';

export class AdminEarningsTotalsDto {
  @ApiProperty()
  @IsString()
  currency!: string;

  @ApiProperty()
  @IsInt()
  grossPaidCents!: number;

  @ApiProperty()
  @IsInt()
  grossRefundedCents!: number;

  @ApiProperty()
  @IsInt()
  grossNetCents!: number;

  @ApiProperty()
  @IsInt()
  platformFeePaidCents!: number;

  @ApiProperty()
  @IsInt()
  platformFeeRefundedCents!: number;

  @ApiProperty()
  @IsInt()
  platformFeeNetCents!: number;

  @ApiProperty()
  @IsInt()
  trainerSharePaidCents!: number;

  @ApiProperty()
  @IsInt()
  trainerShareRefundedCents!: number;

  @ApiProperty()
  @IsInt()
  trainerShareNetCents!: number;

  @ApiProperty(PaymentsDtoSwagger.AdminEarningsTotals.ApiProperty.IsEstimated)
  @IsBoolean()
  isEstimated!: boolean;
}

export class AdminEarningsTraineeRowDto {
  @ApiProperty()
  @IsString()
  traineeId!: string;

  @ApiProperty()
  @IsString()
  traineeName!: string;

  @ApiProperty()
  @IsString()
  traineeEmail!: string;

  @ApiProperty()
  @IsString()
  currency!: string;

  @ApiProperty()
  @IsInt()
  paidCount!: number;

  @ApiProperty()
  @IsInt()
  grossPaidCents!: number;

  @ApiProperty()
  @IsInt()
  grossRefundedCents!: number;

  @ApiProperty()
  @IsInt()
  grossNetCents!: number;
}

export class AdminEarningsTrainerPayoutBreakdownDto {
  @ApiProperty(
    PaymentsDtoSwagger.AdminEarningsTrainerPayoutBreakdown.ApiProperty
      .StatusCounts,
  )
  @IsObject()
  statusCounts!: Record<string, number>;
}

export class AdminEarningsTrainerRowDto {
  @ApiProperty()
  @IsString()
  trainerId!: string;

  @ApiProperty()
  @IsString()
  trainerName!: string;

  @ApiProperty()
  @IsString()
  trainerEmail!: string;

  @ApiProperty()
  @IsString()
  currency!: string;

  @ApiProperty()
  @IsInt()
  trainerSharePaidCents!: number;

  @ApiProperty()
  @IsInt()
  trainerShareRefundedCents!: number;

  @ApiProperty()
  @IsInt()
  trainerShareNetCents!: number;

  @ApiProperty(
    PaymentsDtoSwagger.AdminEarningsTrainerRow.ApiProperty.Payout(
      AdminEarningsTrainerPayoutBreakdownDto,
    ),
  )
  payout!: AdminEarningsTrainerPayoutBreakdownDto;
}

export class AdminEarningsResponseDto {
  @ApiProperty(
    PaymentsDtoSwagger.AdminEarningsResponse.ApiProperty.Totals(
      AdminEarningsTotalsDto,
    ),
  )
  @IsArray()
  totals!: AdminEarningsTotalsDto[];

  @ApiProperty(
    PaymentsDtoSwagger.AdminEarningsResponse.ApiProperty.Trainees(
      AdminEarningsTraineeRowDto,
    ),
  )
  @IsArray()
  trainees!: AdminEarningsTraineeRowDto[];

  @ApiProperty(
    PaymentsDtoSwagger.AdminEarningsResponse.ApiProperty.Trainers(
      AdminEarningsTrainerRowDto,
    ),
  )
  @IsArray()
  trainers!: AdminEarningsTrainerRowDto[];
}
