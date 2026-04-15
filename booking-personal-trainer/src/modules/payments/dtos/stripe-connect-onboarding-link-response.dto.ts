import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class StripeConnectOnboardingLinkResponseDto {
  @ApiProperty()
  @IsString()
  url!: string;

  @ApiProperty()
  @IsString()
  stripeAccountId!: string;
}
