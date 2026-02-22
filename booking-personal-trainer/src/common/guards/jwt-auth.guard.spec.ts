import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

// Commons
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: Reflector;

  const createMockContext = (): ExecutionContext =>
    ({
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({ getRequest: () => ({}), getResponse: () => ({}) }),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new JwtAuthGuard(reflector);
  });

  it('should allow access when route is marked public', () => {
    const getAllAndOverrideSpy = jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(true);
    const mockHandler = jest.fn();
    const mockClass = jest.fn();
    const context = {
      ...createMockContext(),
      getHandler: () => mockHandler,
      getClass: () => mockClass,
    };

    const result = guard.canActivate(context);

    expect(result).toBe(true);
    expect(getAllAndOverrideSpy).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
      mockHandler,
      mockClass,
    ]);
  });
});
