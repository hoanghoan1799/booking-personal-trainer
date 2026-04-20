import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

import { FIELD_DESCRIPTIONS } from '../../../common/constants/message.constant';
import { VALIDATION } from '../../../common/constants/validation.constant';

export class LinkAuth0ToLocalDto {
  @ApiProperty({
    description: 'Third-party JWT (RS256)',
    example: 'eyJhbGciOiJSUzI1NiIs...',
  })
  @IsString()
  @IsNotEmpty()
  token!: string;

  @ApiProperty({
    description: FIELD_DESCRIPTIONS.COMMON.PASSWORD,
    example: FIELD_DESCRIPTIONS.COMMON.PASSWORD_EXAMPLE,
    minLength: VALIDATION.PASSWORD_MIN_LENGTH,
    writeOnly: true,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(VALIDATION.PASSWORD_MIN_LENGTH)
  password!: string;
}
