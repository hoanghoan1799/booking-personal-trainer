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
import { ERROR_MESSAGES } from '../../../common/constants/message.constant';

// DTOs
import { TokensDto } from './token.dto';
import { ResponseUserDto } from '../../user/dtos/response-user.dto';

import { AuthDtoSwagger } from '../constants/auth-swagger-dto.constants';

export class LoginDto {
  @ApiProperty(AuthDtoSwagger.Login.ApiProperty.Email)
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty(AuthDtoSwagger.Login.ApiProperty.Password)
  @IsString()
  @IsNotEmpty({ message: ERROR_MESSAGES.VALIDATION.PASSWORD_REQUIRED })
  password: string;
}

export class LoginResponseDto extends TokensDto {
  @IsObject()
  @ValidateNested()
  @Type(() => ResponseUserDto)
  user: ResponseUserDto;

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
  @ApiProperty(
    AuthDtoSwagger.AuthResponseData.ApiProperty.AuthUser(ResponseUserDto),
  )
  @IsObject()
  @ValidateNested()
  @Type(() => ResponseUserDto)
  user: ResponseUserDto;

  @ApiProperty(AuthDtoSwagger.AuthResponseData.ApiProperty.AccessToken)
  @IsString()
  @IsNotEmpty()
  accessToken: string;

  @ApiProperty(AuthDtoSwagger.AuthResponseData.ApiProperty.RefreshToken)
  @IsString()
  @IsNotEmpty()
  refreshToken: string;

  @ApiProperty(AuthDtoSwagger.AuthResponseData.ApiProperty.AccessTokenExpiresIn)
  @IsNumber()
  @IsNotEmpty()
  accessTokenExpiresIn: number;

  @ApiProperty(
    AuthDtoSwagger.AuthResponseData.ApiProperty.RefreshTokenExpiresIn,
  )
  @IsNumber()
  @IsNotEmpty()
  refreshTokenExpiresIn: number;
}
