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
import { UserDtoSwagger } from '../constants/user-swagger-dto.constants';

export class GetUsersQueryDto extends BaseQueryDto {
  @ApiPropertyOptional(
    UserDtoSwagger.GetUsersQuery.ApiPropertyOptional.UserType,
  )
  @IsOptional()
  @IsEnum(UserType)
  userType?: UserType;

  @ApiPropertyOptional(UserDtoSwagger.GetUsersQuery.ApiPropertyOptional.Role)
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional(
    UserDtoSwagger.GetUsersQuery.ApiPropertyOptional.ApprovalStatus,
  )
  @IsOptional()
  @IsEnum(TrainerApprovalStatus)
  approvalStatus?: TrainerApprovalStatus;

  @ApiPropertyOptional(UserDtoSwagger.GetUsersQuery.ApiPropertyOptional.Search)
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional(UserDtoSwagger.GetUsersQuery.ApiPropertyOptional.SortBy)
  @IsOptional()
  @IsEnum(SortBy)
  sortBy?: SortBy;
}
