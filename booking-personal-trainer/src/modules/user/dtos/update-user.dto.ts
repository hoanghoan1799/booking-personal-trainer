import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional } from 'class-validator';

// Commons
import { UserRole } from '../../../common/enums/user/user.enum';
import { UserDtoSwagger } from '../constants/user-swagger-dto.constants';

// DTOs

export class UpdateUserRoleDto {
  @ApiProperty(UserDtoSwagger.UpdateUserRole.ApiProperty.Role)
  @IsEnum(UserRole)
  role: UserRole;
}

export class UpdateUserProfileDto {
  @ApiPropertyOptional(UserDtoSwagger.UpdateUserProfile.ApiPropertyOptional.Age)
  @IsOptional()
  @IsNumber()
  age?: number;

  @ApiPropertyOptional(
    UserDtoSwagger.UpdateUserProfile.ApiPropertyOptional.Height,
  )
  @IsOptional()
  @IsNumber()
  height?: number;

  @ApiPropertyOptional(
    UserDtoSwagger.UpdateUserProfile.ApiPropertyOptional.Weight,
  )
  @IsOptional()
  @IsNumber()
  weight?: number;
}
