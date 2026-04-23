import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

// Commons
import { AuthDtoSwagger } from '../constants/auth-swagger-dto.constants';

export class RevokeTokenDto {
  @IsString()
  @IsNotEmpty()
  userId: string;
}

export class RefreshTokenRequestDto {
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

export class RefreshTokenDto extends RefreshTokenRequestDto {
  @IsString()
  @IsNotEmpty()
  userId: string;
}

export class AccessTokenDto {
  @ApiProperty(AuthDtoSwagger.Token.ApiProperty.AccessToken)
  @IsString()
  @IsNotEmpty()
  accessToken: string;
}

export class TokensDto {
  @ApiProperty(AuthDtoSwagger.Token.ApiProperty.AccessToken)
  @IsString()
  @IsNotEmpty()
  accessToken: string;

  @ApiProperty(AuthDtoSwagger.Token.ApiProperty.RefreshToken)
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

export class TokenResponseDto extends TokensDto {
  @IsNumber()
  @IsNotEmpty()
  expiresIn: number;
}

/**
 * Response body for token refresh endpoint.
 * Returns a new access token and refresh token.
 */
export class RefreshTokenResponseDto {
  @ApiProperty(AuthDtoSwagger.Token.ApiProperty.RefreshTokenResponse)
  @IsString()
  accessToken: string;

  @ApiProperty(AuthDtoSwagger.Token.ApiProperty.NewRefreshToken)
  @IsString()
  refreshToken: string;
}

/**
 * Response body for logout endpoint.
 */
export class LogoutResponseDto {
  @ApiProperty(AuthDtoSwagger.Token.ApiProperty.LogoutSuccess)
  success: boolean;
}
