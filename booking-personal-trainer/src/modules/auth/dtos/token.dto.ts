import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class TokenResponseDto {
  @IsString()
  @IsNotEmpty()
  accessToken: string;

  @IsNumber()
  @IsNotEmpty()
  expiresIn: number;
}

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
