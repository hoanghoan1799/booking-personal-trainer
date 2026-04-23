import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';

import { TrainerSchedulingDtoSwagger } from '../constants/trainer-scheduling-swagger-dto.constants';

export class UpdateTrainerAvailabilityDto {
  @ApiPropertyOptional(
    TrainerSchedulingDtoSwagger.UpdateTrainerAvailability.ApiPropertyOptional
      .StartTime,
  )
  @IsOptional()
  @IsDateString()
  startTime?: string;

  @ApiPropertyOptional(
    TrainerSchedulingDtoSwagger.UpdateTrainerAvailability.ApiPropertyOptional
      .EndTime,
  )
  @IsOptional()
  @IsDateString()
  endTime?: string;
}
