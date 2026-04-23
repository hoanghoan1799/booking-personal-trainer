import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString } from 'class-validator';

import { ReportingDtoSwagger } from '../constants/reporting-swagger-dto.constants';

export class TrainerKpiRowDto {
  @ApiProperty()
  @IsString()
  trainerId!: string;

  @ApiProperty()
  @IsString()
  trainerName!: string;

  @ApiProperty()
  @IsString()
  trainerEmail!: string;

  @ApiProperty()
  @IsInt()
  confirmedBookingsCount!: number;

  @ApiProperty()
  @IsInt()
  cancelledBookingsCount!: number;

  @ApiProperty()
  @IsInt()
  rejectedBookingsCount!: number;

  @ApiProperty()
  @IsInt()
  workoutsDoneCount!: number;

  @ApiProperty(ReportingDtoSwagger.TrainerKpiRow.ApiProperty.DeliveredMinutes)
  @IsInt()
  deliveredMinutes!: number;

  @ApiProperty(
    ReportingDtoSwagger.TrainerKpiRow.ApiProperty.TrainerShareNetCents,
  )
  @IsInt()
  trainerShareNetCents!: number;
}
