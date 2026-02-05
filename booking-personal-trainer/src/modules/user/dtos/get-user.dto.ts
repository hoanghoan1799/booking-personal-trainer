import { IsEnum, IsOptional, IsString } from 'class-validator';

// Commons
import {
  TrainerApprovalStatus,
  UserRole,
  UserType,
} from '../../../common/enums/user/user.enum';
import { SortBy } from '../../../common/enums/pagination/pagination.enum';
import { BaseQueryDto } from '../../../common/dtos/base-query.dto';

export class GetUsersQueryDto extends BaseQueryDto {
  @IsOptional()
  @IsEnum(UserType)
  userType?: UserType;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsEnum(TrainerApprovalStatus)
  approvalStatus?: TrainerApprovalStatus;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(SortBy)
  sortBy?: SortBy;
}
