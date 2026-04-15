import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

import { API_FORMATS } from '../../../common/constants/message.constant';

export class CreateBookingWorkoutDto {
  @ApiProperty({
    description: 'Exercise template id to snapshot into the workout',
    format: API_FORMATS.UUID,
    example: '9b3b77d0-3e3c-4c0b-8a0d-1c4d2b2e2b0a',
  })
  @IsUUID()
  @IsNotEmpty()
  templateId!: string;

  @ApiPropertyOptional({
    description:
      'Workout price in cents (quote). If omitted, server uses DEFAULT_WORKOUT_PRICE_CENTS.',
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  amountCents?: number;

  @ApiPropertyOptional({
    description: 'Currency for the workout quote. Defaults to USD.',
    example: 'USD',
  })
  @IsOptional()
  @IsString()
  currency?: string;
}
