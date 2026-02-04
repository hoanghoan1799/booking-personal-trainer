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

export class RegisterDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(VALIDATION.PASSWORD_MIN_LENGTH, {
    message: ERROR_MESSAGES.AUTH.PASSWORD_MIN_LENGTH(
      VALIDATION.PASSWORD_MIN_LENGTH,
    ),
  })
  password: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(VALIDATION.NAME_MAX_LENGTH)
  userName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(VALIDATION.NAME_MAX_LENGTH)
  firstName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(VALIDATION.NAME_MAX_LENGTH)
  lastName: string;

  @IsEnum(UserType)
  @IsNotEmpty()
  userType: UserType;

  @IsEnum(UserRole)
  role: UserRole = UserRole.TRAINEE;

  @IsEnum(TrainerApprovalStatus)
  approvalStatus: TrainerApprovalStatus = TrainerApprovalStatus.NONE;

  @IsEnum(UserStatus)
  status: UserStatus = UserStatus.ACTIVE;
}
