import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { WorkoutStatus } from '../../../common/enums/workout/workout.enum';
import {
  API_FORMATS,
  FIELD_DESCRIPTIONS,
} from '../../../common/constants/message.constant';

export class WorkoutsQueryDto {
  @ApiPropertyOptional({
    description: FIELD_DESCRIPTIONS.QUERY.PAGE,
    default: 1,
  })
  @Type(() => Number)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({
    description: FIELD_DESCRIPTIONS.QUERY.LIMIT,
    default: 20,
  })
  @Type(() => Number)
  @IsOptional()
  limit?: number = 20;

  @ApiPropertyOptional({
    description: FIELD_DESCRIPTIONS.QUERY.TRAINER_ID_FILTER,
    format: API_FORMATS.UUID,
    example: FIELD_DESCRIPTIONS.USER.ID_EXAMPLE,
  })
  @IsOptional()
  @IsUUID()
  trainerId?: string;

  @ApiPropertyOptional({
    description: FIELD_DESCRIPTIONS.QUERY.TRAINEE_ID_FILTER,
    format: API_FORMATS.UUID,
    example: FIELD_DESCRIPTIONS.USER.ID_EXAMPLE,
  })
  @IsOptional()
  @IsUUID()
  traineeId?: string;

  @ApiPropertyOptional({
    description: FIELD_DESCRIPTIONS.QUERY.WORKOUT_STATUS_FILTER,
    enum: WorkoutStatus,
  })
  @IsOptional()
  @IsEnum(WorkoutStatus)
  status?: WorkoutStatus;
}
