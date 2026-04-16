import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsInt, IsObject, IsString } from 'class-validator';

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

  @ApiProperty({
    description:
      'True when any platformFee/trainerShare values were estimated (missing metadata).',
  })
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
  @ApiProperty({
    description:
      'Counts by payout status (TRANSFERRED/AWAITING_TRAINER_CONNECT/FAILED/...).',
    example: { TRANSFERRED: 10, AWAITING_TRAINER_CONNECT: 2 },
  })
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

  @ApiProperty({ type: AdminEarningsTrainerPayoutBreakdownDto })
  payout!: AdminEarningsTrainerPayoutBreakdownDto;
}

export class AdminEarningsResponseDto {
  @ApiProperty({ type: [AdminEarningsTotalsDto] })
  @IsArray()
  totals!: AdminEarningsTotalsDto[];

  @ApiProperty({ type: [AdminEarningsTraineeRowDto] })
  @IsArray()
  trainees!: AdminEarningsTraineeRowDto[];

  @ApiProperty({ type: [AdminEarningsTrainerRowDto] })
  @IsArray()
  trainers!: AdminEarningsTrainerRowDto[];
}
