import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
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

  @IsNumber()
  @IsNotEmpty()
  accessTokenExpiresIn: number;

  @IsNumber()
  @IsNotEmpty()
  refreshTokenExpiresIn: number;
}

/**
 * Response data for login/register endpoints.
 * Contains user information, tokens, and expiration times.
 */
export class AuthResponseDataDto {
  @ApiProperty({
    description: FIELD_DESCRIPTIONS.AUTH.AUTHENTICATED_USER,
    type: () => ResponseUserDto,
  })
  @IsObject()
  @ValidateNested()
  @Type(() => ResponseUserDto)
  user: ResponseUserDto;

  @ApiProperty({
    description: FIELD_DESCRIPTIONS.AUTH.ACCESS_TOKEN,
    example: FIELD_DESCRIPTIONS.AUTH.ACCESS_TOKEN_EXAMPLE,
  })
  @IsString()
  @IsNotEmpty()
  accessToken: string;

  @ApiProperty({
    description: FIELD_DESCRIPTIONS.AUTH.JWT_REFRESH_TOKEN,
    example: FIELD_DESCRIPTIONS.AUTH.ACCESS_TOKEN_EXAMPLE,
  })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;

  @ApiProperty({
    description: 'Access token expiration time in seconds',
    example: 900,
  })
  @IsNumber()
  @IsNotEmpty()
  accessTokenExpiresIn: number;

  @ApiProperty({
    description: 'Refresh token expiration time in seconds',
    example: 604800,
  })
  @IsNumber()
  @IsNotEmpty()
  refreshTokenExpiresIn: number;
}
