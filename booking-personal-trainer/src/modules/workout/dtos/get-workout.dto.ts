import { IsEnum, IsOptional } from 'class-validator';

// Commons
import { BaseQueryDto } from '../../../common/dtos/base-query.dto';
import { WorkoutStatus } from '../../../common/enums/workout/workout.enum';

export class WorkoutQueryDto extends BaseQueryDto {
  @IsOptional()
  @IsEnum(WorkoutStatus)
  status?: WorkoutStatus;
}
