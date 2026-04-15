import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt } from 'class-validator';

export class CreateWorkoutPaymentIntentResponseDto {
  @ApiProperty()
  @IsString()
  paymentId!: string;

  @ApiProperty()
  @IsString()
  providerPaymentIntentId!: string;

  @ApiProperty()
  @IsString()
  clientSecret!: string;

  @ApiProperty()
  @IsInt()
  amountCents!: number;

  @ApiProperty()
  @IsString()
  currency!: string;
}
