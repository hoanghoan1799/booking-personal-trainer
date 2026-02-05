import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import {
  TrainerApprovalStatus,
  UserType,
} from '../../../common/enums/user/user.enum';
import {
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
} from '../../../common/constants/pagination.constant';

export class GetUsersQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = DEFAULT_PAGE;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit = DEFAULT_LIMIT;

  @IsOptional()
  @IsEnum(UserType)
  userType?: UserType;

  @IsOptional()
  @IsEnum(TrainerApprovalStatus)
  approvalStatus?: TrainerApprovalStatus;

  @IsOptional()
  @IsString()
  search?: string;
}
