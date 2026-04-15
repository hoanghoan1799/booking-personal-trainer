import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class WorkoutPaymentAccessResponseDto {
  @ApiProperty({ description: 'Whether the workout is fully unlocked (paid).' })
  @IsBoolean()
  isPaid!: boolean;

  @ApiProperty({
    description: 'Trainee view mode derived from payment state.',
    enum: ['LIMITED', 'FULL'],
  })
  @IsString()
  view!: 'LIMITED' | 'FULL';

  @ApiPropertyOptional({
    description: 'Active billing charge id (quote) for the workout, if any.',
    format: 'uuid',
    nullable: true,
  })
  @IsOptional()
  @IsUUID()
  billingChargeId?: string | null;

  @ApiPropertyOptional({
    description: 'Quoted price in cents from billing_charges.',
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  amountCents?: number | null;

  @ApiPropertyOptional({
    description: 'Currency for the quoted price (from billing_charges).',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  currency?: string | null;
}
