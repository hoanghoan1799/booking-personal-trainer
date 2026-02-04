import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class RefreshTokenDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

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
