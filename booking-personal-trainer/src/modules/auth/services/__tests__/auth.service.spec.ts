jest.mock('../token-verifier.service', () => ({
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
import { ERROR_MESSAGES } from '../../../../common/constants/message.constant';
import {
  TrainerApprovalStatus,
  UserRole,
  UserStatus,
  UserType,
} from '../../../../common/enums/user/user.enum';

// Services
import { AuthService } from '../auth.service';
import { UserService } from '../../../user/services/user.service';
import { HashingService } from '../hashing.service';
import { RefreshTokenService } from '../refresh-token.service';
import { TokenVerifierService } from '../token-verifier.service';
import { LOCAL_PROVIDER_NAME } from '../../constants/auth0-provider.constant';
import { NotificationsService } from '../../../notifications/services/notifications.service';
import { EmailService } from '../../../email/services/email.service';

describe('AuthService', () => {
  let service: AuthService;
  let userService: {
    findByEmailOrUserName: jest.Mock;
    create: jest.Mock;
    findById: jest.Mock;
    findByEmail: jest.Mock;
    findByUserName: jest.Mock;
    createUserProvider: jest.Mock;
    findUserProviderByIdentity: jest.Mock;
    getAdminEmailAddresses: jest.Mock;
    ensureLocalUserProviderForUser: jest.Mock;
    pickUniqueUserNameFromEmail: jest.Mock;
    saveUser: jest.Mock;
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
  let notificationsService: { notifyAdmins: jest.Mock };
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
      createUserProvider: jest.fn().mockResolvedValue(undefined),
      findUserProviderByIdentity: jest.fn().mockResolvedValue(null),
      getAdminEmailAddresses: jest.fn().mockResolvedValue([]),
      ensureLocalUserProviderForUser: jest.fn().mockResolvedValue(undefined),
      pickUniqueUserNameFromEmail: jest.fn().mockResolvedValue('picked'),
      saveUser: jest.fn().mockResolvedValue(undefined),
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
    notificationsService = {
      notifyAdmins: jest.fn().mockResolvedValue(undefined),
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
        { provide: EmailService, useValue: emailService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);

    jwtService.signAsync.mockResolvedValue('mock-jwt-token');
  });

  afterEach(() => {
    delete process.env.FRONTEND_URL;
    jest.clearAllMocks();
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
      expect(userService.createUserProvider).toHaveBeenCalledWith({
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
      expect(userService.createUserProvider).toHaveBeenCalled();
      expect(refreshTokenService.saveRefreshToken).toHaveBeenCalled();
    });

    it('should enqueue admin email when admin recipients exist', async () => {
      process.env.FRONTEND_URL = 'https://app.test/';
      userService.findByEmailOrUserName.mockResolvedValue(null);
      userService.create.mockResolvedValue({ ...mockUser, ...registerData });
      userService.getAdminEmailAddresses.mockResolvedValue(['admin@test.com']);
      emailService.send.mockResolvedValue({ jobId: 'job-1' });

      await service.register(registerData);

      expect(emailService.send).toHaveBeenCalledWith(
        expect.objectContaining({ to: ['admin@test.com'] }),
      );
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
      expect(userService.ensureLocalUserProviderForUser).toHaveBeenCalledWith(
        mockUser,
      );
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

      expect(actual.data).toEqual(
        expect.objectContaining({
          id: mockUser.id,
          email: mockUser.email,
          userName: mockUser.userName,
          firstName: mockUser.firstName,
          lastName: mockUser.lastName,
          role: mockUser.role,
          userType: mockUser.userType,
          hasPassword: true,
        }),
      );
      expect((actual.data as unknown as { password?: unknown }).password).toBe(
        undefined,
      );
    });
  });

  describe('exchangeToken', () => {
    it('should throw BadRequestException when email is missing', async () => {
      auth0TokenVerifier.verifyAndDecode.mockResolvedValue({
        sub: 'auth0|sub',
        email: undefined,
        email_verified: true,
      });

      await expect(
        service.exchangeToken({ token: 'auth0-token' }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.exchangeToken({ token: 'auth0-token' }),
      ).rejects.toThrow(ERROR_MESSAGES.AUTH.EMAIL_MISSING);
    });

    it('should throw UnauthorizedException when email is not verified', async () => {
      auth0TokenVerifier.verifyAndDecode.mockResolvedValue({
        sub: 'auth0|sub',
        email: 'user@test.com',
        email_verified: false,
      });
      await expect(
        service.exchangeToken({ token: 'auth0-token' }),
      ).rejects.toThrow(UnauthorizedException);
      await expect(
        service.exchangeToken({ token: 'auth0-token' }),
      ).rejects.toThrow(ERROR_MESSAGES.AUTH.EMAIL_NOT_VERIFIED);
    });

    it('should throw BadRequestException when existing user by email requires linking', async () => {
      auth0TokenVerifier.verifyAndDecode.mockResolvedValue({
        sub: 'auth0|sub',
        email: mockUser.email,
        email_verified: true,
      });
      userService.findUserProviderByIdentity.mockResolvedValue(null);
      userService.findByEmail.mockResolvedValue(mockUser);

      await expect(
        service.exchangeToken({ token: 'auth0-token' }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.exchangeToken({ token: 'auth0-token' }),
      ).rejects.toThrow(ERROR_MESSAGES.AUTH.ACCOUNT_LINK_REQUIRED);
    });

    it('should load user when identity already linked', async () => {
      auth0TokenVerifier.verifyAndDecode.mockResolvedValue({
        sub: 'auth0|sub',
        email: mockUser.email,
        email_verified: true,
        name: 'Test User',
      });
      userService.findUserProviderByIdentity.mockResolvedValue({
        id: 'provider-id',
        user: { id: mockUser.id },
      });
      userService.findById.mockResolvedValue(mockUser);

      const actual = await service.exchangeToken({ token: 'auth0-token' });

      expect(actual.user.email).toBe(mockUser.email);
      expect(userService.create).not.toHaveBeenCalled();
    });

    it('should create user and provider when new Auth0 user', async () => {
      auth0TokenVerifier.verifyAndDecode.mockResolvedValue({
        sub: 'auth0|sub',
        email: 'new@test.com',
        email_verified: true,
        given_name: 'New',
        family_name: 'User',
      });
      userService.findUserProviderByIdentity.mockResolvedValue(null);
      userService.findByEmail.mockResolvedValue(null);
      userService.pickUniqueUserNameFromEmail.mockResolvedValue('picked');
      userService.create.mockResolvedValue({
        ...mockUser,
        id: 'new-id',
        email: 'new@test.com',
        userName: 'picked',
        userType: UserType.TRAINEE,
      });

      const actual = await service.exchangeToken({ token: 'auth0-token' });

      expect(actual.user.id).toBe('new-id');
      expect(userService.createUserProvider).toHaveBeenCalledWith(
        expect.objectContaining({
          providerName: 'auth0',
          providerUserId: 'auth0|sub',
        }),
      );
    });
  });

  describe('logout', () => {
    it('should remove refresh token by userId when provided', async () => {
      await service.logout({ userId: mockUser.id });

      expect(refreshTokenService.removeRefreshToken).toHaveBeenCalledWith({
        userId: mockUser.id,
      });
    });

    it('should no-op when refreshToken missing', async () => {
      await service.logout({});
      expect(refreshTokenService.removeRefreshToken).not.toHaveBeenCalled();
    });

    it('should swallow verify errors for refreshToken', async () => {
      jwtService.verifyAsync.mockRejectedValue(new Error('bad token'));

      await service.logout({ refreshToken: 'rt' });

      expect(refreshTokenService.removeRefreshToken).not.toHaveBeenCalled();
    });

    it('should remove token when refreshToken verifies', async () => {
      jwtService.verifyAsync.mockResolvedValue({
        id: mockUser.id,
        email: mockUser.email,
        userName: mockUser.userName,
        role: mockUser.role,
      });

      await service.logout({ refreshToken: 'rt' });

      expect(refreshTokenService.removeRefreshToken).toHaveBeenCalledWith({
        userId: mockUser.id,
      });
    });
  });

  describe('linkAuth0ToLocal', () => {
    it('should link when password matches and return tokens', async () => {
      auth0TokenVerifier.verifyAndDecode.mockResolvedValue({
        sub: 'auth0|sub',
        email: mockUser.email,
        email_verified: true,
      });
      userService.findByEmail.mockResolvedValue(mockUser);
      hashingService.compare.mockResolvedValue(true);
      userService.findUserProviderByIdentity.mockResolvedValue(null);

      const actual = await service.linkAuth0ToLocal({
        token: 'auth0-token',
        password: 'password123',
      });

      expect(actual).toHaveProperty('accessToken');
      expect(userService.createUserProvider).toHaveBeenCalledWith({
        userId: mockUser.id,
        providerName: 'auth0',
        providerUserId: 'auth0|sub',
      });
      expect(refreshTokenService.saveRefreshToken).toHaveBeenCalled();
    });

    it('should throw BadRequestException when password does not match', async () => {
      auth0TokenVerifier.verifyAndDecode.mockResolvedValue({
        sub: 'auth0|sub',
        email: mockUser.email,
        email_verified: true,
      });
      userService.findByEmail.mockResolvedValue(mockUser);
      hashingService.compare.mockResolvedValue(false);

      await expect(
        service.linkAuth0ToLocal({ token: 'auth0-token', password: 'wrong' }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.linkAuth0ToLocal({ token: 'auth0-token', password: 'wrong' }),
      ).rejects.toThrow(ERROR_MESSAGES.VALIDATION.PASSWORD_NOT_MATCH);
    });
  });

  describe('setPassword', () => {
    it('should set password and create local provider', async () => {
      userService.findById.mockResolvedValue({
        ...mockUser,
        password: undefined,
      });

      await service.setPassword({
        userId: mockUser.id,
        newPassword: 'password123',
      });

      expect(hashingService.hash).toHaveBeenCalledWith('password123');
      expect(userService.saveUser).toHaveBeenCalled();
      expect(userService.ensureLocalUserProviderForUser).toHaveBeenCalled();
    });
  });
});
