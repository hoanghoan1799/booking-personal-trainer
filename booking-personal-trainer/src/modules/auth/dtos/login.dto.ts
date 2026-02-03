import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

// Commons
import { ERROR_MESSAGES } from '../../../common/constants/message.constant';

export class LoginDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty({ message: ERROR_MESSAGES.VALIDATION.PASSWORD_REQUIRED })
  password: string;
}
