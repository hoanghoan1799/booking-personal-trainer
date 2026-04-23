import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

import { ERROR_MESSAGES } from '../../../common/constants/message.constant';
import { VALIDATION } from '../../../common/constants/validation.constant';
import { AuthDtoSwagger } from '../constants/auth-swagger-dto.constants';

export class SetPasswordDto {
  @ApiProperty(AuthDtoSwagger.SetPassword.ApiProperty.NewPassword)
  @IsString()
  @IsNotEmpty({ message: ERROR_MESSAGES.VALIDATION.PASSWORD_REQUIRED })
  @MinLength(VALIDATION.PASSWORD_MIN_LENGTH, {
    message: ERROR_MESSAGES.AUTH.PASSWORD_MIN_LENGTH(
      VALIDATION.PASSWORD_MIN_LENGTH,
    ),
  })
  newPassword!: string;
}
