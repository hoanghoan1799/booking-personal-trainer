import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsInt, IsObject, IsString } from 'class-validator';

export class TrainerPayoutsCurrencySummaryDto {
  @ApiProperty()
  @IsString()
  currency!: string;

  @ApiProperty({ description: 'Total trainer share for PAID payments.' })
  @IsInt()
  paidTrainerShareCents!: number;

  @ApiProperty({ description: 'Total trainer share for REFUNDED payments.' })
  @IsInt()
  refundedTrainerShareCents!: number;

  @ApiProperty({ description: 'Net trainer share (paid - refunded).' })
  @IsInt()
  netTrainerShareCents!: number;

  @ApiProperty({
    description:
      'Counts by payout status (TRANSFERRED/AWAITING_TRAINER_CONNECT/FAILED/...).',
    example: { TRANSFERRED: 10, AWAITING_TRAINER_CONNECT: 2 },
  })
  @IsObject()
  payoutStatusCounts!: Record<string, number>;

  @ApiProperty({
    description:
      'True when any trainerShare was estimated (missing metadata.trainerShareCents).',
  })
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

  @ApiProperty({ nullable: true })
  @IsString()
  transferId!: string | null;

  @ApiProperty({ nullable: true })
  @IsString()
  errorMessage!: string | null;
}

export class TrainerPayoutsResponseDto {
  @ApiProperty({ type: [TrainerPayoutsCurrencySummaryDto] })
  @IsArray()
  summary!: TrainerPayoutsCurrencySummaryDto[];

  @ApiProperty({
    type: [TrainerPayoutsTransferRowDto],
    description:
      'Latest payout rows for reference (transfer id or error), filtered by date/currency.',
  })
  @IsArray()
  rows!: TrainerPayoutsTransferRowDto[];
}
