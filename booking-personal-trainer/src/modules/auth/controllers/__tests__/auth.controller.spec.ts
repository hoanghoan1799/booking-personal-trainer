import { Test, type TestingModule } from '@nestjs/testing';

import { BaseResponseDto } from '../../../../common/dtos/base-response.dto';
import { UserRole } from '../../../../common/enums/user/user.enum';
import type { JwtAuthPayload } from '../../types/jwt-auth.type';

jest.mock('jwks-rsa', () => ({
  __esModule: true,
  default: jest.fn(() => ({})),
}));

import { AuthController } from '../auth.controller';
import { AuthService } from '../../services/auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: {
    register: jest.Mock;
    login: jest.Mock;
    exchangeToken: jest.Mock;
    linkAuth0ToLocal: jest.Mock;
    setPassword: jest.Mock;
    refreshTokens: jest.Mock;
    logout: jest.Mock;
    getProfile: jest.Mock;
  };

  beforeEach(async () => {
    authService = {
      register: jest.fn(),
      login: jest.fn(),
      exchangeToken: jest.fn(),
      linkAuth0ToLocal: jest.fn(),
      setPassword: jest.fn(),
      refreshTokens: jest.fn(),
      logout: jest.fn(),
      getProfile: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('register should wrap ok response', async () => {
    authService.register.mockResolvedValue({
      accessToken: 'a',
      refreshToken: 'r',
      user: { id: 'u1' },
      accessTokenExpiresIn: 1,
      refreshTokenExpiresIn: 2,
    });

    const actual = await controller.create({
      email: 'e@test.com',
      password: 'pw',
      userName: 'u',
      firstName: 'F',
      lastName: 'L',
      userType: 'TRAINEE',
    } as never);

    expect(actual).toBeInstanceOf(BaseResponseDto);
    expect(actual.data.accessToken).toBe('a');
  });

  it('login should wrap ok response', async () => {
    authService.login.mockResolvedValue({
      accessToken: 'a',
      refreshToken: 'r',
      user: { id: 'u1' },
      accessTokenExpiresIn: 1,
      refreshTokenExpiresIn: 2,
    });

    const actual = await controller.login({
      email: 'e@test.com',
      password: 'pw',
    } as never);

    expect(actual.data.refreshToken).toBe('r');
  });

  it('tokenExchange should wrap ok response', async () => {
    authService.exchangeToken.mockResolvedValue({
      accessToken: 'a',
      refreshToken: 'r',
      user: { id: 'u1' },
      accessTokenExpiresIn: 1,
      refreshTokenExpiresIn: 2,
    });

    const actual = await controller.tokenExchange({ token: 't' } as never);

    expect(actual.data.accessToken).toBe('a');
  });

  it('linkAuth0 should wrap ok response', async () => {
    authService.linkAuth0ToLocal.mockResolvedValue({
      accessToken: 'a',
      refreshToken: 'r',
      user: { id: 'u1' },
      accessTokenExpiresIn: 1,
      refreshTokenExpiresIn: 2,
    });

    const actual = await controller.linkAuth0({
      token: 't',
      password: 'pw',
    } as never);

    expect(actual.data.user.id).toBe('u1');
  });

  it('setPassword should call service', async () => {
    authService.setPassword.mockResolvedValue(undefined);
    const user: JwtAuthPayload = {
      id: 'u1',
      email: 'e@test.com',
      userName: 'u',
      role: UserRole.TRAINEE,
    };

    await controller.setPassword(user, { newPassword: 'pw2' } as never);

    expect(authService.setPassword).toHaveBeenCalledWith({
      userId: 'u1',
      newPassword: 'pw2',
    });
  });

  it('refresh should return tokens dto', async () => {
    authService.refreshTokens.mockResolvedValue({
      accessToken: 'a',
      refreshToken: 'r',
    });

    const actual = await controller.refresh({ refreshToken: 'r' } as never);

    expect(actual.refreshToken).toBe('r');
  });

  it('logout should return success true', async () => {
    authService.logout.mockResolvedValue(undefined);

    const actual = await controller.logout({ refreshToken: 'r' });

    expect(authService.logout).toHaveBeenCalledWith({ refreshToken: 'r' });
    expect(actual.success).toBe(true);
  });

  it('getProfile should forward', async () => {
    const expected = BaseResponseDto.ok({ id: 'u1' });
    authService.getProfile.mockResolvedValue(expected);
    const user: JwtAuthPayload = {
      id: 'u1',
      email: 'e@test.com',
      userName: 'u',
      role: UserRole.TRAINEE,
    };

    const actual = await controller.getProfile(user);

    expect(authService.getProfile).toHaveBeenCalledWith('u1');
    expect(actual).toBe(expected);
  });
});
