import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

/**
 * Body for exchanging a verified Auth0 JWT for application tokens.
 * Send an access token (audience = Auth0 API / AUTH0_AUDIENCE) or an ID token (audience = AUTH0_CLIENT_ID).
 */
// TODO: Update naming for exchange api
export class Auth0ExchangeDto {
  @ApiProperty({
    description: 'Auth0 JWT (RS256)',
    example: 'eyJhbGciOiJSUzI1NiIs...',
  })
  @IsString()
  @IsNotEmpty()
  auth0Token!: string;
}
