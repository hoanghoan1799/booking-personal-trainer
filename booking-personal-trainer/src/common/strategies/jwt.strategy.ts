import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

// Constants
import { ERROR_MESSAGES } from '../constants/message.constant';

// Types
import { JwtAuthPayload } from '../../modules/auth/types/jwt-auth.type';

import { UserService } from '../../modules/user/services/user.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private configService: ConfigService,
    private readonly userService: UserService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtAuthPayload) {
    const user = await this.userService.findByIdOrNull(payload.id);

    if (!user) {
      throw new UnauthorizedException(ERROR_MESSAGES.AUTH.ACCESS_TOKEN_INVALID);
    }

    return user;
  }
}
