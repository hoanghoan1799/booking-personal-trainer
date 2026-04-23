import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

import { AuthDtoSwagger } from '../constants/auth-swagger-dto.constants';

export class TokenExchangeDto {
  @ApiProperty(AuthDtoSwagger.TokenExchange.ApiProperty.Token)
  @IsString()
  @IsNotEmpty()
  token!: string;
}
