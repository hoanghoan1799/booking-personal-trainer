import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

// Commons
import { TrainerSchedulingDtoSwagger } from '../constants/trainer-scheduling-swagger-dto.constants';

export class TrainerAvailabilityResponseDto {
  @ApiProperty(
    TrainerSchedulingDtoSwagger.TrainerAvailabilityResponse.ApiProperty.Id,
  )
  @Expose()
  id: string;

  @ApiProperty(
    TrainerSchedulingDtoSwagger.TrainerAvailabilityResponse.ApiProperty
      .DayOfWeek,
  )
  @Expose()
  dayOfWeek: number;

  @ApiProperty(
    TrainerSchedulingDtoSwagger.TrainerAvailabilityResponse.ApiProperty
      .StartTime,
  )
  @Expose()
  startTime: Date;

  @ApiProperty(
    TrainerSchedulingDtoSwagger.TrainerAvailabilityResponse.ApiProperty.EndTime,
  )
  @Expose()
  endTime: Date;

  @ApiPropertyOptional(
    TrainerSchedulingDtoSwagger.TrainerAvailabilityResponse.ApiPropertyOptional
      .CreatedAt,
  )
  @Expose()
  createdAt?: Date;

  @ApiPropertyOptional(
    TrainerSchedulingDtoSwagger.TrainerAvailabilityResponse.ApiPropertyOptional
      .UpdatedAt,
  )
  @Expose()
  updatedAt?: Date;
}
