import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

// Commons
import { TrainerSchedulingDtoSwagger } from '../constants/trainer-scheduling-swagger-dto.constants';

export class UpdateTrainerAvailabilityResponseDto {
  @ApiProperty(
    TrainerSchedulingDtoSwagger.UpdateTrainerAvailabilityResponse.ApiProperty
      .Id,
  )
  @Expose()
  id: string;

  @ApiProperty(
    TrainerSchedulingDtoSwagger.UpdateTrainerAvailabilityResponse.ApiProperty
      .DayOfWeek,
  )
  @Expose()
  dayOfWeek: number;

  @ApiProperty(
    TrainerSchedulingDtoSwagger.UpdateTrainerAvailabilityResponse.ApiProperty
      .StartTime,
  )
  @Expose()
  startTime: Date;

  @ApiProperty(
    TrainerSchedulingDtoSwagger.UpdateTrainerAvailabilityResponse.ApiProperty
      .EndTime,
  )
  @Expose()
  endTime: Date;

  @ApiPropertyOptional(
    TrainerSchedulingDtoSwagger.UpdateTrainerAvailabilityResponse
      .ApiPropertyOptional.UpdatedAt,
  )
  @Expose()
  updatedAt?: Date;
}
