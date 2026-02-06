import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { WorkoutStatus } from '../../../common/enums/workout/workout.enum';

export class WorkoutsQueryDto {
  @Type(() => Number)
  @IsOptional()
  page?: number = 1;

  @Type(() => Number)
  @IsOptional()
  limit?: number = 20;

  @IsOptional()
  @IsUUID()
  trainerId?: string;

  @IsOptional()
  @IsUUID()
  traineeId?: string;

  @IsOptional()
  @IsEnum(WorkoutStatus)
  status?: WorkoutStatus;
}
