import { PartialType } from '@nestjs/mapped-types';
import { IsEnum } from 'class-validator';

// Commons
import { UserRole } from '../../../common/enums/user/user.enum';

// DTOs
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(CreateUserDto) {}

export class UpdateUserRoleDto {
  @IsEnum(UserRole)
  role: UserRole;
}
