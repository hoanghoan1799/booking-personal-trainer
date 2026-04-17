jest.mock('./services/token-verifier.service', () => ({
  TokenVerifierService: class TokenVerifierService {},
}));

import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

// Commons
import { ERROR_MESSAGES } from '../../common/constants/message.constant';
import {
  TrainerApprovalStatus,
  UserRole,
  UserStatus,
  UserType,
} from '../../common/enums/user/user.enum';

// Services
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { HashingService } from './services/hashing.service';
import { RefreshTokenService } from './services/refresh-token.service';
import { TokenVerifierService } from './services/token-verifier.service';
import { UserProviderRepositoryToken } from '../user/repositories/user-provider.repository.interface';
import { LOCAL_PROVIDER_NAME } from './constants/auth0-provider.constant';
import { NotificationsService } from '../notifications/notifications.service';
import { UserRepositoryToken } from '../user/repositories/user.repository.interface';
import { EmailService } from '../email/email.service';

describe('AuthService', () => {
  let service: AuthService;
  let userService: {
    findByEmailOrUserName: jest.Mock;
    create: jest.Mock;
    findById: jest.Mock;
    findByEmail: jest.Mock;
    findByUserName: jest.Mock;
  };
  let jwtService: {
    signAsync: jest.Mock;
    verifyAsync: jest.Mock;
  };
  let hashingService: { hash: jest.Mock; compare: jest.Mock };
  let refreshTokenService: {
    saveRefreshToken: jest.Mock;
    validateRefreshToken: jest.Mock;
    removeRefreshToken: jest.Mock;
  };
  let auth0TokenVerifier: { verifyAndDecode: jest.Mock };
  let userProviderRepository: {
    findByProviderIdentity: jest.Mock;
    create: jest.Mock;
  };
  let notificationsService: { notifyAdmins: jest.Mock };
  let userRepo: { findAndCount: jest.Mock };
  let emailService: { send: jest.Mock };

  const mockUser = {
    id: 'user-uuid',
    email: 'user@test.com',
    userName: 'testuser',
    role: UserRole.TRAINEE,
    password: 'hashed',
    firstName: 'Test',
    lastName: 'User',
    userType: UserType.TRAINEE,
  };

  beforeEach(async () => {
    userService = {
      findByEmailOrUserName: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findByUserName: jest.fn(),
    };
    jwtService = {
      signAsync: jest.fn().mockResolvedValue('mock-token'),
      verifyAsync: jest.fn(),
    };
    hashingService = {
      hash: jest.fn().mockResolvedValue('hashed-password'),
      compare: jest.fn().mockResolvedValue(true),
    };
    refreshTokenService = {
      saveRefreshToken: jest.fn().mockResolvedValue(undefined),
      validateRefreshToken: jest.fn().mockResolvedValue(true),
      removeRefreshToken: jest.fn().mockResolvedValue(undefined),
    };
    auth0TokenVerifier = {
      verifyAndDecode: jest.fn(),
    };
    userProviderRepository = {
      findByProviderIdentity: jest.fn(),
      create: jest.fn().mockResolvedValue(undefined),
    };
    userProviderRepository.findByProviderIdentity.mockResolvedValue(null);
    notificationsService = {
      notifyAdmins: jest.fn().mockResolvedValue(undefined),
    };
    userRepo = {
      findAndCount: jest.fn().mockResolvedValue([[], 0]),
    };
    emailService = {
      send: jest.fn().mockResolvedValue({ messageId: 'mock-message-id' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: userService },
        { provide: JwtService, useValue: jwtService },
        { provide: HashingService, useValue: hashingService },
        { provide: RefreshTokenService, useValue: refreshTokenService },
        { provide: TokenVerifierService, useValue: auth0TokenVerifier },
        { provide: NotificationsService, useValue: notificationsService },
        {
          provide: UserProviderRepositoryToken,
          useValue: userProviderRepository,
        },
        { provide: UserRepositoryToken, useValue: userRepo },
        { provide: EmailService, useValue: emailService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);

    jwtService.signAsync.mockResolvedValue('mock-jwt-token');
  });

  describe('register', () => {
    const registerData = {
      email: 'new@test.com',
      password: 'password123',
      userName: 'newuser',
      firstName: 'New',
      lastName: 'User',
      userType: UserType.TRAINEE,
      role: UserRole.TRAINEE,
      approvalStatus: TrainerApprovalStatus.NONE,
      status: UserStatus.ACTIVE,
    };

    it('should throw ConflictException when email is already taken', async () => {
      userService.findByEmailOrUserName.mockResolvedValue({
        ...mockUser,
        email: registerData.email,
      });

      await expect(service.register(registerData)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.register(registerData)).rejects.toThrow(
        ERROR_MESSAGES.USER.EMAIL_TAKEN,
      );
    });

    it('should throw ConflictException when userName is already taken', async () => {
      userService.findByEmailOrUserName.mockResolvedValue({
        ...mockUser,
        userName: registerData.userName,
      });

      await expect(service.register(registerData)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.register(registerData)).rejects.toThrow(
        ERROR_MESSAGES.USER.USERNAME_TAKEN,
      );
    });

    it('should create user and return tokens when valid', async () => {
      userService.findByEmailOrUserName.mockResolvedValue(null);
      userService.create.mockResolvedValue({ ...mockUser, ...registerData });

      const actual = await service.register(registerData);

      expect(actual).toHaveProperty('accessToken');
      expect(actual).toHaveProperty('refreshToken');
      expect(actual).toHaveProperty('user');
      expect(actual.user.email).toBe(registerData.email);
      expect(hashingService.hash).toHaveBeenCalledWith(registerData.password);
      expect(userService.create).toHaveBeenCalled();
      expect(userProviderRepository.create).toHaveBeenCalledWith({
        userId: mockUser.id,
        providerName: LOCAL_PROVIDER_NAME,
        providerUserId: registerData.email.toLowerCase(),
      });
      expect(refreshTokenService.saveRefreshToken).toHaveBeenCalled();
    });

    it('should create user and return tokens when admin notify or email fails', async () => {
      userService.findByEmailOrUserName.mockResolvedValue(null);
      userService.create.mockResolvedValue({ ...mockUser, ...registerData });
      emailService.send.mockRejectedValue(
        new InternalServerErrorException('Failed to enqueue email: Redis down'),
      );

      const actual = await service.register(registerData);

      expect(actual).toHaveProperty('accessToken');
      expect(userProviderRepository.create).toHaveBeenCalled();
      expect(refreshTokenService.saveRefreshToken).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const loginData = { email: 'user@test.com', password: 'password123' };

    it('should throw NotFoundException when user not found', async () => {
      userService.findByEmailOrUserName.mockResolvedValue(null);

      await expect(service.login(loginData)).rejects.toThrow(NotFoundException);
      await expect(service.login(loginData)).rejects.toThrow(
        ERROR_MESSAGES.USER.NOT_FOUND,
      );
    });

    it('should throw BadRequestException when account has no password (Auth0-only user)', async () => {
      userService.findByEmailOrUserName.mockResolvedValue({
        ...mockUser,
        password: undefined,
      });

      await expect(service.login(loginData)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.login(loginData)).rejects.toThrow(
        ERROR_MESSAGES.AUTH.LOGIN_USE_NO_PASSWORD,
      );
    });

    it('should throw BadRequestException when password is invalid', async () => {
      userService.findByEmailOrUserName.mockResolvedValue(mockUser);
      hashingService.compare.mockResolvedValue(false);

      await expect(service.login(loginData)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.login(loginData)).rejects.toThrow(
        ERROR_MESSAGES.VALIDATION.PASSWORD_NOT_MATCH,
      );
    });

    it('should return tokens and user when credentials are valid', async () => {
      userService.findByEmailOrUserName.mockResolvedValue(mockUser);
      hashingService.compare.mockResolvedValue(true);

      const actual = await service.login(loginData);

      expect(actual).toHaveProperty('accessToken');
      expect(actual).toHaveProperty('refreshToken');
      expect(actual.user.email).toBe(loginData.email);
      expect(
        userProviderRepository.findByProviderIdentity,
      ).toHaveBeenCalledWith({
        providerName: LOCAL_PROVIDER_NAME,
        providerUserId: loginData.email.toLowerCase(),
      });
      expect(userProviderRepository.create).toHaveBeenCalledWith({
        userId: mockUser.id,
        providerName: LOCAL_PROVIDER_NAME,
        providerUserId: loginData.email.toLowerCase(),
      });
      expect(refreshTokenService.saveRefreshToken).toHaveBeenCalled();
    });
  });

  describe('refreshTokens', () => {
    it('should throw BadRequestException when refreshToken is missing', async () => {
      await expect(service.refreshTokens({ refreshToken: '' })).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.refreshTokens({ refreshToken: '' })).rejects.toThrow(
        ERROR_MESSAGES.AUTH.REFRESH_TOKEN_REQUIRED,
      );
    });

    it('should throw UnauthorizedException when refreshToken is invalid', async () => {
      jwtService.verifyAsync.mockRejectedValue(new Error('invalid'));

      await expect(
        service.refreshTokens({ refreshToken: 'bad-token' }),
      ).rejects.toThrow(UnauthorizedException);
      await expect(
        service.refreshTokens({ refreshToken: 'bad-token' }),
      ).rejects.toThrow(ERROR_MESSAGES.AUTH.INVALID_REFRESH_TOKEN);
    });

    it('should throw UnauthorizedException when stored refresh token does not match', async () => {
      jwtService.verifyAsync.mockResolvedValue({
        id: mockUser.id,
        email: mockUser.email,
        userName: mockUser.userName,
        role: mockUser.role,
      });
      refreshTokenService.validateRefreshToken.mockResolvedValue(false);

      await expect(
        service.refreshTokens({ refreshToken: 'stale-token' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw NotFoundException when user no longer exists', async () => {
      jwtService.verifyAsync.mockResolvedValue({
        id: mockUser.id,
        email: mockUser.email,
        userName: mockUser.userName,
        role: mockUser.role,
      });
      refreshTokenService.validateRefreshToken.mockResolvedValue(true);
      userService.findById.mockResolvedValue(null);

      await expect(
        service.refreshTokens({ refreshToken: 'valid-token' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return new tokens when refresh token is valid', async () => {
      jwtService.verifyAsync.mockResolvedValue({
        id: mockUser.id,
        email: mockUser.email,
        userName: mockUser.userName,
        role: mockUser.role,
      });
      refreshTokenService.validateRefreshToken.mockResolvedValue(true);
      userService.findById.mockResolvedValue(mockUser);

      const actual = await service.refreshTokens({
        refreshToken: 'valid-refresh-token',
      });

      expect(actual).toHaveProperty('accessToken');
      expect(actual).toHaveProperty('refreshToken');
      expect(refreshTokenService.saveRefreshToken).toHaveBeenCalled();
    });
  });

  describe('getProfile', () => {
    it('should throw NotFoundException when user not found', async () => {
      userService.findById.mockResolvedValue(null);

      await expect(service.getProfile('missing-id')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getProfile('missing-id')).rejects.toThrow(
        ERROR_MESSAGES.USER.NOT_FOUND,
      );
    });

    it('should return user in BaseResponseDto when found', async () => {
      userService.findById.mockResolvedValue(mockUser);

      const actual = await service.getProfile(mockUser.id);

      expect(actual.data).toEqual(mockUser);
    });
  });
});
