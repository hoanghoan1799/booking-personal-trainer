import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

import { WorkoutDtoSwagger } from '../constants/workout-swagger-dto.constants';

export class CreateBookingWorkoutDto {
  @ApiProperty(WorkoutDtoSwagger.CreateBookingWorkout.ApiProperty.TemplateId)
  @IsUUID()
  @IsNotEmpty()
  templateId!: string;

  @ApiPropertyOptional(
    WorkoutDtoSwagger.CreateBookingWorkout.ApiPropertyOptional.AmountCents,
  )
  @IsOptional()
  @IsInt()
  @Min(1)
  amountCents?: number;

  @ApiPropertyOptional(
    WorkoutDtoSwagger.CreateBookingWorkout.ApiPropertyOptional.Currency,
  )
  @IsOptional()
  @IsString()
  currency?: string;
}
