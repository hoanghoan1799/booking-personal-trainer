import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ERROR_MESSAGES } from '../../constants/message.constant';
import { UserService } from '../../../modules/user/services/user.service';
import { JwtStrategy } from '../jwt.strategy';
import { UserRole } from '../../enums/user/user.enum';
import type { JwtAuthPayload } from '../../../modules/auth/types/jwt-auth.type';

describe('JwtStrategy', () => {
  let configService: { getOrThrow: jest.Mock };
  let userService: { findByIdOrNull: jest.Mock };

  beforeEach(() => {
    configService = { getOrThrow: jest.fn().mockReturnValue('secret') };
    userService = { findByIdOrNull: jest.fn() };
  });

  it('should return user when user exists', async () => {
    const expectedUser = { id: 'user-id' };
    userService.findByIdOrNull.mockResolvedValue(expectedUser);
    const strategy = new JwtStrategy(
      configService as unknown as ConfigService,
      userService as unknown as UserService,
    );

    const actual = await strategy.validate({
      id: 'user-id',
      email: 'user@test.com',
      userName: 'user',
      role: UserRole.TRAINEE,
    } satisfies JwtAuthPayload);

    expect(configService.getOrThrow).toHaveBeenCalledWith('JWT_SECRET');
    expect(userService.findByIdOrNull).toHaveBeenCalledWith('user-id');
    expect(actual).toBe(expectedUser);
  });

  it('should throw UnauthorizedException when user is missing', async () => {
    userService.findByIdOrNull.mockResolvedValue(null);
    const strategy = new JwtStrategy(
      configService as unknown as ConfigService,
      userService as unknown as UserService,
    );

    await expect(
      strategy.validate({
        id: 'missing-id',
        email: 'user@test.com',
        userName: 'user',
        role: UserRole.TRAINEE,
      } satisfies JwtAuthPayload),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(
      strategy.validate({
        id: 'missing-id',
        email: 'user@test.com',
        userName: 'user',
        role: UserRole.TRAINEE,
      } satisfies JwtAuthPayload),
    ).rejects.toThrow(ERROR_MESSAGES.AUTH.ACCESS_TOKEN_INVALID);
  });
});
