import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/core';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Request } from 'express';

// Constants
import { TOKEN_COOKIE } from '../constants/token.constants';
import { ERROR_MESSAGES } from '../constants/message.constant';

// Entities
import { User } from '../../modules/user/entities/user.entity';

// Types
import { JwtAuthPayload } from '../../modules/auth/types/jwt-auth.type';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private configService: ConfigService,
    @InjectRepository(User) private userRepo: EntityRepository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (req: Request) =>
          (req.cookies as Record<string, string>)?.[TOKEN_COOKIE.ACCESS],
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtAuthPayload): Promise<User | null> {
    const user = await this.userRepo.findOne({ id: payload.id });

    if (!user) {
      throw new UnauthorizedException(ERROR_MESSAGES.AUTH.ACCESS_TOKEN_INVALID);
    }

    return user;
  }
}
