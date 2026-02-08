import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsNumber, IsOptional } from 'class-validator';

// Commons
import { UserRole } from '../../../common/enums/user/user.enum';

// DTOs
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(CreateUserDto) {}

export class UpdateUserRoleDto {
  @IsEnum(UserRole)
  role: UserRole;
}

export class UpdateUserProfileDto {
  @IsOptional()
  @IsNumber()
  age?: number;

  @IsOptional()
  @IsNumber()
  height?: number;

  @IsOptional()
  @IsNumber()
  weight?: number;
}
