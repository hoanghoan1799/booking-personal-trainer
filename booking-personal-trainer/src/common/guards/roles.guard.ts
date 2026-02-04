import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';

// Constants
import { ERROR_MESSAGES } from '../constants/message.constant';

// Enums
import { UserRole } from '../enums/user/user.enum';

// Decorators
import { ROLES_KEY } from '../decorators/role.decorator';

// Types
import type { User as UserEntity } from '../../modules/user/entities/user.entity';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) return true;

    const { user } = context
      .switchToHttp()
      .getRequest<Request & { user?: UserEntity }>();

    if (!user) {
      throw new ForbiddenException(ERROR_MESSAGES.AUTH.UNAUTHORIZED);
    }

    if (!requiredRoles.some((role) => user.role === role)) {
      throw new ForbiddenException(ERROR_MESSAGES.AUTH.FORBIDDEN);
    }

    return true;
  }
}
