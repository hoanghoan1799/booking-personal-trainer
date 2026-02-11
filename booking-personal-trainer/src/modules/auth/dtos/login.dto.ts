import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsObject,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

// Commons
import {
  API_FORMATS,
  ERROR_MESSAGES,
  FIELD_DESCRIPTIONS,
} from '../../../common/constants/message.constant';
import { User } from '../../../modules/user/entities/user.entity';

// DTOs
import { TokensDto } from './token.dto';
import { ResponseUserDto } from '../../user/dtos/response-user.dto';

export class LoginDto {
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
    minLength: 6,
    writeOnly: true,
  })
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

/**
 * Response body for login endpoint.
 * Copy accessToken into Swagger Authorize (Bearer) to call protected APIs.
 */
export class LoginSuccessResponseDto {
  @ApiProperty({
    description: FIELD_DESCRIPTIONS.AUTH.AUTHENTICATED_USER,
    type: () => ResponseUserDto,
  })
  data: ResponseUserDto;

  @ApiProperty({
    description: FIELD_DESCRIPTIONS.AUTH.ACCESS_TOKEN_SWAGGER_HINT,
    example: FIELD_DESCRIPTIONS.AUTH.ACCESS_TOKEN_EXAMPLE,
  })
  accessToken: string;
}
