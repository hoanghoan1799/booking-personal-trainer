import {
  IsEmail,
  IsNotEmpty,
  IsObject,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

// Commons
import { ERROR_MESSAGES } from '../../../common/constants/message.constant';
import { User } from '../../../modules/user/entities/user.entity';

// DTOs
import { TokensDto } from './token.dto';

export class LoginDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty({ message: ERROR_MESSAGES.VALIDATION.PASSWORD_REQUIRED })
  password: string;
}

export class LoginResponseDto extends TokensDto {
  @IsObject()
  @ValidateNested()
  @Type(() => User)
  user: User;
}
