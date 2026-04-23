import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsString, MaxLength } from 'class-validator';

import { VALIDATION } from '../../../common/constants/validation.constant';
import { TrainerSchedulingDtoSwagger } from '../constants/trainer-scheduling-swagger-dto.constants';

export class CreateTrainerTimeOffDto {
  @ApiProperty(
    TrainerSchedulingDtoSwagger.CreateTrainerTimeOff.ApiProperty.Reason,
  )
  @IsString()
  @MaxLength(VALIDATION.NAME_MAX_LENGTH)
  reason: string;

  @ApiProperty(
    TrainerSchedulingDtoSwagger.CreateTrainerTimeOff.ApiProperty.StartTime,
  )
  @IsDateString()
  startTime: string;

  @ApiProperty(
    TrainerSchedulingDtoSwagger.CreateTrainerTimeOff.ApiProperty.EndTime,
  )
  @IsDateString()
  endTime: string;
}
