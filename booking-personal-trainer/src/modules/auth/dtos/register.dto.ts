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
import {
  API_FORMATS,
  ERROR_MESSAGES,
  FIELD_DESCRIPTIONS,
} from '../../../common/constants/message.constant';

export class RegisterDto {
  @ApiProperty({
    description: FIELD_DESCRIPTIONS.COMMON.EMAIL,
    example: FIELD_DESCRIPTIONS.COMMON.EMAIL_EXAMPLE,
    format: API_FORMATS.EMAIL,
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: FIELD_DESCRIPTIONS.COMMON.PASSWORD,
    example: FIELD_DESCRIPTIONS.COMMON.PASSWORD_EXAMPLE,
    minLength: VALIDATION.PASSWORD_MIN_LENGTH,
    writeOnly: true,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(VALIDATION.PASSWORD_MIN_LENGTH, {
    message: ERROR_MESSAGES.AUTH.PASSWORD_MIN_LENGTH(
      VALIDATION.PASSWORD_MIN_LENGTH,
    ),
  })
  password: string;

  @ApiProperty({
    description: FIELD_DESCRIPTIONS.COMMON.USERNAME,
    example: FIELD_DESCRIPTIONS.COMMON.USERNAME_EXAMPLE,
    maxLength: VALIDATION.NAME_MAX_LENGTH,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(VALIDATION.NAME_MAX_LENGTH)
  userName: string;

  @ApiProperty({
    description: FIELD_DESCRIPTIONS.COMMON.FIRST_NAME,
    example: FIELD_DESCRIPTIONS.COMMON.FIRST_NAME_EXAMPLE,
    maxLength: VALIDATION.NAME_MAX_LENGTH,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(VALIDATION.NAME_MAX_LENGTH)
  firstName: string;

  @ApiProperty({
    description: FIELD_DESCRIPTIONS.COMMON.LAST_NAME,
    example: FIELD_DESCRIPTIONS.COMMON.LAST_NAME_EXAMPLE,
    maxLength: VALIDATION.NAME_MAX_LENGTH,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(VALIDATION.NAME_MAX_LENGTH)
  lastName: string;

  @ApiProperty({
    description: FIELD_DESCRIPTIONS.USER.USER_TYPE_LONG,
    enum: UserType,
    example: UserType.TRAINEE,
  })
  @IsEnum(UserType)
  @IsNotEmpty()
  userType: UserType;

  @ApiPropertyOptional({
    description: FIELD_DESCRIPTIONS.USER.ROLE_DEFAULT,
    enum: UserRole,
    default: UserRole.TRAINEE,
  })
  @IsEnum(UserRole)
  role: UserRole = UserRole.TRAINEE;

  @ApiPropertyOptional({
    description: FIELD_DESCRIPTIONS.USER.APPROVAL_STATUS_DEFAULT,
    enum: TrainerApprovalStatus,
    default: TrainerApprovalStatus.NONE,
  })
  @IsEnum(TrainerApprovalStatus)
  approvalStatus: TrainerApprovalStatus = TrainerApprovalStatus.NONE;

  @ApiPropertyOptional({
    description: FIELD_DESCRIPTIONS.USER.ACCOUNT_STATUS_DEFAULT,
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  @IsEnum(UserStatus)
  status: UserStatus = UserStatus.ACTIVE;
}
