import { IsOptional, IsString, IsUUID } from 'class-validator';

export class LogoutDto {
  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsString()
  refreshToken?: string;
}
