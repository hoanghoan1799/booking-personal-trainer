import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsInt, Max, Min } from 'class-validator';

import { TrainerSchedulingDtoSwagger } from '../constants/trainer-scheduling-swagger-dto.constants';

export class CreateTrainerAvailabilityDto {
  @ApiProperty(
    TrainerSchedulingDtoSwagger.CreateTrainerAvailability.ApiProperty.DayOfWeek,
  )
  @IsInt()
  @Min(1)
  @Max(7)
  dayOfWeek: number;

  @ApiProperty(
    TrainerSchedulingDtoSwagger.CreateTrainerAvailability.ApiProperty.StartTime,
  )
  @IsDateString()
  startTime: string;

  @ApiProperty(
    TrainerSchedulingDtoSwagger.CreateTrainerAvailability.ApiProperty.EndTime,
  )
  @IsDateString()
  endTime: string;
}
