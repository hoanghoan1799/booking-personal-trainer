import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

// Commons
import { TrainerSchedulingDtoSwagger } from '../constants/trainer-scheduling-swagger-dto.constants';

export class TrainerTimeOffResponseDto {
  @ApiProperty(
    TrainerSchedulingDtoSwagger.TrainerTimeOffResponse.ApiProperty.Id,
  )
  @Expose()
  id: string;

  @ApiProperty(
    TrainerSchedulingDtoSwagger.TrainerTimeOffResponse.ApiProperty.Reason,
  )
  @Expose()
  reason: string;

  @ApiProperty(
    TrainerSchedulingDtoSwagger.TrainerTimeOffResponse.ApiProperty.StartTime,
  )
  @Expose()
  startTime: Date;

  @ApiProperty(
    TrainerSchedulingDtoSwagger.TrainerTimeOffResponse.ApiProperty.EndTime,
  )
  @Expose()
  endTime: Date;

  @ApiPropertyOptional(
    TrainerSchedulingDtoSwagger.TrainerTimeOffResponse.ApiPropertyOptional
      .CreatedAt,
  )
  @Expose()
  createdAt?: Date;

  @ApiPropertyOptional(
    TrainerSchedulingDtoSwagger.TrainerTimeOffResponse.ApiPropertyOptional
      .UpdatedAt,
  )
  @Expose()
  updatedAt?: Date;
}
