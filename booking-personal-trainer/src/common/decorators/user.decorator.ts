import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthPayload } from '../../modules/auth/types/jwt-auth.type';

interface AuthenticatedRequest extends Request {
  user: JwtAuthPayload;
}

export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): JwtAuthPayload => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();

    return request.user;
  },
);
