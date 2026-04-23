import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

import { VALIDATION } from '../../../common/constants/validation.constant';
import { AuthDtoSwagger } from '../constants/auth-swagger-dto.constants';

export class LinkAuth0ToLocalDto {
  @ApiProperty(AuthDtoSwagger.LinkAuth0ToLocal.ApiProperty.Token)
  @IsString()
  @IsNotEmpty()
  token!: string;

  @ApiProperty(AuthDtoSwagger.LinkAuth0ToLocal.ApiProperty.Password)
  @IsString()
  @IsNotEmpty()
  @MinLength(VALIDATION.PASSWORD_MIN_LENGTH)
  password!: string;
}
