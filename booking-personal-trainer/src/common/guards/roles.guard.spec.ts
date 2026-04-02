import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

// Commons
import { ERROR_MESSAGES } from '../constants/message.constant';
import { UserRole } from '../enums/user/user.enum';
import { ROLES_KEY } from '../decorators/role.decorator';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  const createMockContext = (user?: { role: UserRole }): ExecutionContext => {
    const request = { user };
    return {
      switchToHttp: () => ({ getRequest: () => request }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as unknown as ExecutionContext;
  };

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  it('should allow access when no roles are required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const context = createMockContext({ role: UserRole.TRAINEE });

    const result = guard.canActivate(context);

    expect(result).toBe(true);
  });

  it('should throw ForbiddenException when user is missing', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([UserRole.ADMIN]);
    const context = createMockContext(undefined);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    expect(() => guard.canActivate(context)).toThrow(
      ERROR_MESSAGES.AUTH.UNAUTHORIZED,
    );
  });

  it('should throw ForbiddenException when user role is not in required roles', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([UserRole.ADMIN]);
    const context = createMockContext({ role: UserRole.TRAINEE });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    expect(() => guard.canActivate(context)).toThrow(
      ERROR_MESSAGES.AUTH.FORBIDDEN,
    );
  });

  it('should allow access when user role is in required roles', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([UserRole.ADMIN, UserRole.TRAINER]);
    const context = createMockContext({ role: UserRole.TRAINER });

    const result = guard.canActivate(context);

    expect(result).toBe(true);
  });

  it('should read ROLES_KEY from handler and class', () => {
    const getAllAndOverrideSpy = jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([UserRole.TRAINEE]);
    const mockHandler = jest.fn();
    const mockClass = jest.fn();
    const context = {
      ...createMockContext({ role: UserRole.TRAINEE }),
      getHandler: () => mockHandler,
      getClass: () => mockClass,
    };

    guard.canActivate(context);

    expect(getAllAndOverrideSpy).toHaveBeenCalledWith(ROLES_KEY, [
      mockHandler,
      mockClass,
    ]);
  });
});
