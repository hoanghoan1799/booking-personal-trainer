import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

// Commons
import { FIELD_DESCRIPTIONS } from '../../../common/constants/message.constant';

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
  @ApiProperty({
    description: FIELD_DESCRIPTIONS.AUTH.ACCESS_TOKEN,
    example: FIELD_DESCRIPTIONS.AUTH.ACCESS_TOKEN_EXAMPLE,
  })
  @IsString()
  @IsNotEmpty()
  accessToken: string;
}

export class TokensDto {
  @IsString()
  @IsNotEmpty()
  accessToken: string;

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
 * Access token is also set in HTTP-only cookie.
 */
export class RefreshTokenResponseDto {
  @ApiProperty({
    description: FIELD_DESCRIPTIONS.AUTH.REFRESH_TOKEN_RESPONSE,
    example: FIELD_DESCRIPTIONS.AUTH.ACCESS_TOKEN_EXAMPLE,
  })
  @IsString()
  accessToken: string;
}

/**
 * Response body for logout endpoint.
 */
export class LogoutResponseDto {
  @ApiProperty({
    description: FIELD_DESCRIPTIONS.AUTH.LOGOUT_SUCCESS,
    example: true,
  })
  success: boolean;
}
