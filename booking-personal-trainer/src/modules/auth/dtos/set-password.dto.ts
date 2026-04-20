import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

import {
  ERROR_MESSAGES,
  FIELD_DESCRIPTIONS,
} from '../../../common/constants/message.constant';
import { VALIDATION } from '../../../common/constants/validation.constant';

export class SetPasswordDto {
  @ApiProperty({
    description: FIELD_DESCRIPTIONS.COMMON.PASSWORD,
    example: FIELD_DESCRIPTIONS.COMMON.PASSWORD_EXAMPLE,
    minLength: VALIDATION.PASSWORD_MIN_LENGTH,
    writeOnly: true,
  })
  @IsString()
  @IsNotEmpty({ message: ERROR_MESSAGES.VALIDATION.PASSWORD_REQUIRED })
  @MinLength(VALIDATION.PASSWORD_MIN_LENGTH, {
    message: ERROR_MESSAGES.AUTH.PASSWORD_MIN_LENGTH(
      VALIDATION.PASSWORD_MIN_LENGTH,
    ),
  })
  newPassword!: string;
}
