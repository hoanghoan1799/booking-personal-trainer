import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { WorkoutStatus } from '../../../common/enums/workout/workout.enum';
import { WorkoutDtoSwagger } from '../constants/workout-swagger-dto.constants';

export class WorkoutsQueryDto {
  @ApiPropertyOptional(WorkoutDtoSwagger.WorkoutsQuery.ApiPropertyOptional.Page)
  @Type(() => Number)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional(
    WorkoutDtoSwagger.WorkoutsQuery.ApiPropertyOptional.Limit,
  )
  @Type(() => Number)
  @IsOptional()
  limit?: number = 20;

  @ApiPropertyOptional(
    WorkoutDtoSwagger.WorkoutsQuery.ApiPropertyOptional.TrainerId,
  )
  @IsOptional()
  @IsUUID()
  trainerId?: string;

  @ApiPropertyOptional(
    WorkoutDtoSwagger.WorkoutsQuery.ApiPropertyOptional.TraineeId,
  )
  @IsOptional()
  @IsUUID()
  traineeId?: string;

  @ApiPropertyOptional(
    WorkoutDtoSwagger.WorkoutsQuery.ApiPropertyOptional.Status,
  )
  @IsOptional()
  @IsEnum(WorkoutStatus)
  status?: WorkoutStatus;
}
