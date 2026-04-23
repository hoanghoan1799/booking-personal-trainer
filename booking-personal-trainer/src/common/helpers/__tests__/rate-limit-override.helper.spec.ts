import type { ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

import { createRateLimitByIdentityResolver } from '../rate-limit-override.helper';

type ExecutionContextMock = {
  readonly switchToHttp: () => { readonly getRequest: () => Request };
};

describe('createRateLimitByIdentityResolver', () => {
  const createContext = (req: Request): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => req,
      }),
    }) as unknown as ExecutionContextMock as ExecutionContext;

  it('should return user limit when user id present', () => {
    const resolver = createRateLimitByIdentityResolver({
      ip: 1,
      token: 2,
      user: 3,
    });
    const context = createContext({ user: { id: 'u1' } } as unknown as Request);

    const actual = resolver(context);

    expect(actual).toBe(3);
  });

  it('should return token limit when bearer token present', () => {
    const resolver = createRateLimitByIdentityResolver({
      ip: 1,
      token: 2,
      user: 3,
    });
    const context = createContext({
      headers: { authorization: 'Bearer t' },
    } as unknown as Request);

    const actual = resolver(context);

    expect(actual).toBe(2);
  });

  it('should return ip limit when no user and no token', () => {
    const resolver = createRateLimitByIdentityResolver({
      ip: 1,
      token: 2,
      user: 3,
    });
    const context = createContext({
      headers: {},
      ip: '1.2.3.4',
    } as unknown as Request);

    const actual = resolver(context);

    expect(actual).toBe(1);
  });

  it('should fall back to ip limit when bearer token is empty', () => {
    const resolver = createRateLimitByIdentityResolver({
      ip: 1,
      token: 2,
      user: 3,
    });
    const context = createContext({
      headers: { authorization: 'Bearer   ' },
      ip: '1.2.3.4',
    } as unknown as Request);

    const actual = resolver(context);

    expect(actual).toBe(1);
  });
});
