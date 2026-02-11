import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

// Commons
import {
  TrainerApprovalStatus,
  UserRole,
  UserType,
} from '../../../common/enums/user/user.enum';
import { SortBy } from '../../../common/enums/pagination/pagination.enum';
import { BaseQueryDto } from '../../../common/dtos/base-query.dto';
import { FIELD_DESCRIPTIONS } from '../../../common/constants/message.constant';

export class GetUsersQueryDto extends BaseQueryDto {
  @ApiPropertyOptional({
    description: FIELD_DESCRIPTIONS.QUERY.USER_TYPE_FILTER,
    enum: UserType,
  })
  @IsOptional()
  @IsEnum(UserType)
  userType?: UserType;

  @ApiPropertyOptional({
    description: FIELD_DESCRIPTIONS.QUERY.ROLE_FILTER,
    enum: UserRole,
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({
    description: FIELD_DESCRIPTIONS.QUERY.APPROVAL_STATUS_FILTER,
    enum: TrainerApprovalStatus,
  })
  @IsOptional()
  @IsEnum(TrainerApprovalStatus)
  approvalStatus?: TrainerApprovalStatus;

  @ApiPropertyOptional({
    description: FIELD_DESCRIPTIONS.QUERY.SEARCH,
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: FIELD_DESCRIPTIONS.QUERY.SORT_BY,
    enum: SortBy,
  })
  @IsOptional()
  @IsEnum(SortBy)
  sortBy?: SortBy;
}
