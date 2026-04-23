import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

import { VALIDATION } from '../../../common/constants/validation.constant';
import { TrainerSchedulingDtoSwagger } from '../constants/trainer-scheduling-swagger-dto.constants';

export class UpdateTrainerTimeOffDto {
  @ApiPropertyOptional(
    TrainerSchedulingDtoSwagger.UpdateTrainerTimeOff.ApiPropertyOptional.Reason,
  )
  @IsOptional()
  @IsString()
  @MaxLength(VALIDATION.NAME_MAX_LENGTH)
  reason?: string;

  @ApiPropertyOptional(
    TrainerSchedulingDtoSwagger.UpdateTrainerTimeOff.ApiPropertyOptional
      .StartTime,
  )
  @IsOptional()
  @IsDateString()
  startTime?: string;

  @ApiPropertyOptional(
    TrainerSchedulingDtoSwagger.UpdateTrainerTimeOff.ApiPropertyOptional
      .EndTime,
  )
  @IsOptional()
  @IsDateString()
  endTime?: string;
}
