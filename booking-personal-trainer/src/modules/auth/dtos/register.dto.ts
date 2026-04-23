import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

// Commons
import {
  TrainerApprovalStatus,
  UserRole,
  UserStatus,
  UserType,
} from '../../../common/enums/user/user.enum';
import { VALIDATION } from '../../../common/constants/validation.constant';
import { ERROR_MESSAGES } from '../../../common/constants/message.constant';

import { AuthDtoSwagger } from '../constants/auth-swagger-dto.constants';

export class RegisterDto {
  @ApiProperty(AuthDtoSwagger.Register.ApiProperty.Email)
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty(AuthDtoSwagger.Register.ApiProperty.Password)
  @IsString()
  @IsNotEmpty()
  @MinLength(VALIDATION.PASSWORD_MIN_LENGTH, {
    message: ERROR_MESSAGES.AUTH.PASSWORD_MIN_LENGTH(
      VALIDATION.PASSWORD_MIN_LENGTH,
    ),
  })
  password: string;

  @ApiProperty(AuthDtoSwagger.Register.ApiProperty.UserName)
  @IsString()
  @IsNotEmpty()
  @MaxLength(VALIDATION.NAME_MAX_LENGTH)
  userName: string;

  @ApiProperty(AuthDtoSwagger.Register.ApiProperty.FirstName)
  @IsString()
  @IsNotEmpty()
  @MaxLength(VALIDATION.NAME_MAX_LENGTH)
  firstName: string;

  @ApiProperty(AuthDtoSwagger.Register.ApiProperty.LastName)
  @IsString()
  @IsNotEmpty()
  @MaxLength(VALIDATION.NAME_MAX_LENGTH)
  lastName: string;

  @ApiProperty(AuthDtoSwagger.Register.ApiProperty.UserType)
  @IsEnum(UserType)
  @IsNotEmpty()
  userType: UserType;

  @ApiPropertyOptional(AuthDtoSwagger.Register.ApiPropertyOptional.Role)
  @IsEnum(UserRole)
  role: UserRole = UserRole.TRAINEE;

  @ApiPropertyOptional(
    AuthDtoSwagger.Register.ApiPropertyOptional.ApprovalStatus,
  )
  @IsEnum(TrainerApprovalStatus)
  approvalStatus: TrainerApprovalStatus = TrainerApprovalStatus.NONE;

  @ApiPropertyOptional(AuthDtoSwagger.Register.ApiPropertyOptional.Status)
  @IsEnum(UserStatus)
  status: UserStatus = UserStatus.ACTIVE;
}
