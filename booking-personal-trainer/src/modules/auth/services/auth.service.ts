import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { plainToInstance } from 'class-transformer';

// Commons
import { ERROR_MESSAGES } from '../../../common/constants/message.constant';
import { utcNowAsDate } from '../../../common/utils/date-time/utc-date-time.helper';
import { TOKEN_EXPIRATION } from '../../../common/constants/token.constants';
import { BaseResponseDto } from '../../../common/dtos/base-response.dto';
import {
  TrainerApprovalStatus,
  UserRole,
  UserStatus,
  UserType,
} from '../../../common/enums/user/user.enum';

// Types
import { JwtAuthPayload } from '../types/jwt-auth.type';

// Entities
import { User } from '../../user/entities/user.entity';

// DTOs
import { RegisterDto } from '../dtos/register.dto';
import { LoginDto, LoginResponseDto } from '../dtos/login.dto';
import { RefreshTokenRequestDto, TokensDto } from '../dtos/token.dto';
import { LogoutDto } from '../dtos/logout.dto';
import { TokenExchangeDto } from '../dtos/token-exchange.dto';
import { ResponseUserDto } from '../../user/dtos/response-user.dto';
import { ResponseFullUserDto } from '../../user/dtos/response-user.dto';

// Services
import { UserService } from '../../user/services/user.service';
import { HashingService } from './hashing.service';
import { RefreshTokenService } from './refresh-token.service';
import { TokenVerifierService } from './token-verifier.service';
import { NotificationsService } from '../../notifications/services/notifications.service';
import { NotificationType } from '../../notifications/enums/notification-type.enum';
import { NotificationTemplates } from '../../notifications/constants/notification-template.constant';
import { EmailService } from '../../email/services/email.service';
import { EmailTemplates } from '../../email/constants/email-template.constant';
import { AUTH_PROVIDER_METHOD } from '../constants/auth-provider-method.constant';
import type { AuthProviderMethod } from '../types/auth-provider-method.type';
import { parseTokenExpirationStringToSeconds } from '../helpers/parse-token-expiration-to-seconds.helper';
import { splitNameFromAuth0Claims } from '../helpers/split-name-from-auth0-claims.helper';

// Constants
import {
  AUTH0_PROVIDER_NAME,
  LOCAL_PROVIDER_NAME,
} from '../constants/auth0-provider.constant';

@Injectable()
export class AuthService {
  private readonly logger: Logger = new Logger(AuthService.name);

  /**
   * Initializes a new instance of the AuthService.
   * @param {UserService} userService - The user service used to interact with the user database.
   * @param {JwtService} jwtService - The JWT service used to generate and validate JWT tokens.
   * @param {HashingService} hashingService - The hashing service used to hash passwords.
   * @param {RefreshTokenService} refreshTokenService - The refresh token service used to manage refresh tokens in Redis.
   */
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly hashingService: HashingService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly auth0TokenVerifier: TokenVerifierService,
    private readonly notificationsService: NotificationsService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Registers a new user and automatically authenticates them.
   * @param data The user data to be registered.
   * @returns The authentication tokens and newly registered user.
   * @throws ConflictException If the email or user name already exists.
   */
  async register(data: RegisterDto): Promise<LoginResponseDto> {
    const { email, password, userName, userType, firstName, lastName } = data;

    const existingUser = await this.userService.findByEmailOrUserName(
      email,
      userName,
    );

    if (existingUser) {
      if (existingUser.email === email) {
        throw new ConflictException(ERROR_MESSAGES.USER.EMAIL_TAKEN);
      }

      if (existingUser.userName === data.userName) {
        throw new ConflictException(ERROR_MESSAGES.USER.USERNAME_TAKEN);
      }
    }

    const hashedPassword = await this.hashingService.hash(password);

    const approvalStatus =
      data.userType === UserType.TRAINEE
        ? TrainerApprovalStatus.NONE
        : TrainerApprovalStatus.PENDING;

    const newUser = await this.userService.create({
      email,
      password: hashedPassword,
      userName,
      userType,
      firstName,
      lastName,
      role: UserRole.TRAINEE,
      approvalStatus,
      status: UserStatus.ACTIVE,
    });
    await this.notifyAdminsAboutNewUserRegistration({
      userName: newUser.userName,
      source: AUTH_PROVIDER_METHOD.Local,
      userId: newUser.id,
      email: newUser.email,
      userType: newUser.userType,
    });

    await this.userService.createUserProvider({
      userId: newUser.id,
      providerName: LOCAL_PROVIDER_NAME,
      providerUserId: email.trim().toLowerCase(),
    });

    // Automatically authenticate the newly registered user
    const payload: JwtAuthPayload = {
      id: newUser.id,
      email: newUser.email,
      userName: newUser.userName,
      role: newUser.role,
    };

    const {
      accessToken,
      refreshToken,
      accessTokenExpiresIn,
      refreshTokenExpiresIn,
    } = await this.createTokens(payload);

    await this.refreshTokenService.saveRefreshToken({
      userId: newUser.id,
      refreshToken,
    });

    const userResponse = plainToInstance(ResponseUserDto, newUser, {
      excludeExtraneousValues: true,
      enableImplicitConversion: true,
    });

    return {
      accessToken,
      refreshToken,
      user: userResponse,
      accessTokenExpiresIn,
      refreshTokenExpiresIn,
    };
  }

  /**
   * Publishes admin notifications and enqueues the admin email for a new user.
   * Does not throw: registration must succeed even when Redis or the email queue is unavailable.
   */
  private async notifyAdminsAboutNewUserRegistration(input: {
    readonly userName: string;
    readonly source: AuthProviderMethod;
    readonly userId: string;
    readonly email: string;
    readonly userType: UserType;
  }): Promise<void> {
    try {
      await this.notificationsService.notifyAdmins({
        type: NotificationType.AdminNewUserRegistered,
        ...NotificationTemplates.adminNewUserRegistered({
          userName: input.userName,
          source: input.source,
        }),
        data: {
          userId: input.userId,
          email: input.email,
          userType: input.userType,
        },
      });
      const adminEmails = await this.userService.getAdminEmailAddresses();
      if (adminEmails.length === 0) {
        this.logger.warn(
          `Skipping admin email: no ADMIN recipients found (${input.source}).`,
        );
        return;
      }
      const frontendUrl: string = (process.env.FRONTEND_URL ?? '').replace(
        /\/$/,
        '',
      );
      const template = EmailTemplates.adminNewUserRegistered({
        userName: input.userName,
        userEmail: input.email,
        registeredAt: utcNowAsDate(),
        userUrl: `${frontendUrl}/admin/users/${input.userId}`,
        authProvider: input.source,
        source: input.source,
      });
      const { jobId } = await this.emailService.send({
        to: adminEmails,
        subject: template.subject,
        text: template.text,
        html: template.html,
      });
      this.logger.log(
        `Admin email enqueued (${input.source}) jobId=${jobId ?? 'null'} recipients=${adminEmails.length}`,
      );
    } catch (err: unknown) {
      const message: string = err instanceof Error ? err.message : String(err);
      const stack: string | undefined =
        err instanceof Error ? err.stack : undefined;
      this.logger.error(
        `Failed to notify admins after new user registration (${input.source}): ${message}`,
        stack,
      );
    }
  }

  /**
   * Logs in the user.
   * @param data The user data to be logged in.
   * @returns The logged in user.
   * @throws {NotFoundException} If the user is not found.
   * @throws {BadRequestException} If the password is not valid.
   */
  async login(data: LoginDto): Promise<LoginResponseDto> {
    const { email, password } = data;

    const existingUser: User | null =
      await this.userService.findByEmailOrUserName(email);

    if (!existingUser) {
      throw new NotFoundException(ERROR_MESSAGES.USER.NOT_FOUND);
    }
    if (!existingUser.password) {
      throw new BadRequestException(ERROR_MESSAGES.AUTH.LOGIN_USE_NO_PASSWORD);
    }

    const isPasswordValid: boolean = await this.hashingService.compare(
      password,
      existingUser.password,
    );

    if (!isPasswordValid) {
      throw new BadRequestException(
        ERROR_MESSAGES.VALIDATION.PASSWORD_NOT_MATCH,
      );
    }

    await this.userService.ensureLocalUserProviderForUser(existingUser);

    const payload: JwtAuthPayload = {
      id: existingUser.id,
      email: existingUser.email,
      userName: existingUser.userName,
      role: existingUser.role,
    };

    const {
      accessToken,
      refreshToken,
      accessTokenExpiresIn,
      refreshTokenExpiresIn,
    } = await this.createTokens(payload);

    await this.refreshTokenService.saveRefreshToken({
      userId: existingUser.id,
      refreshToken,
    });

    const userResponse = plainToInstance(ResponseUserDto, existingUser, {
      excludeExtraneousValues: true,
      enableImplicitConversion: true,
    });

    return {
      accessToken,
      refreshToken,
      user: userResponse,
      accessTokenExpiresIn,
      refreshTokenExpiresIn,
    };
  }

  /**
   * Refreshes the access token and refresh token.
   * @param args The arguments to refresh the tokens.
   * @returns A promise that resolves to a TokensDto with the new access token and its expiration time in seconds.
   * @throws {BadRequestException} If the refreshToken is not provided.
   * @throws {UnauthorizedException} If the refreshToken is not valid.
   * @throws {NotFoundException} If the user is not found.
   */
  async refreshTokens(args: RefreshTokenRequestDto): Promise<TokensDto> {
    const { refreshToken } = args;
    if (!refreshToken) {
      throw new BadRequestException(ERROR_MESSAGES.AUTH.REFRESH_TOKEN_REQUIRED);
    }

    let payload: JwtAuthPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtAuthPayload>(
        refreshToken,
        {
          ignoreExpiration: false,
        },
      );
    } catch {
      throw new UnauthorizedException(
        ERROR_MESSAGES.AUTH.INVALID_REFRESH_TOKEN,
      );
    }

    const isValid: boolean =
      await this.refreshTokenService.validateRefreshToken({
        userId: payload.id,
        refreshToken,
      });

    if (!isValid) {
      await this.refreshTokenService.removeRefreshToken({
        userId: payload.id,
      });
      throw new UnauthorizedException(
        ERROR_MESSAGES.AUTH.INVALID_REFRESH_TOKEN,
      );
    }

    const existingUser = await this.userService.findById(payload.id);
    if (!existingUser) {
      throw new NotFoundException(ERROR_MESSAGES.USER.NOT_FOUND);
    }

    const tokens = await this.createTokens({
      id: existingUser.id,
      email: existingUser.email,
      userName: existingUser.userName,
      role: existingUser.role,
    });

    await this.refreshTokenService.saveRefreshToken({
      userId: existingUser.id,
      refreshToken: tokens.refreshToken,
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  /**
   * Invalidates the stored refresh token: by userId when present, else by
   * verifying the refresh JWT and using its subject.
   * @param args Logout body (userId and/or refreshToken).
   */
  async logout(args: LogoutDto): Promise<void> {
    if (args.userId) {
      await this.refreshTokenService.removeRefreshToken({
        userId: args.userId,
      });
      return;
    }
    if (!args.refreshToken) {
      return;
    }
    await this.removeRefreshFromVerifiedRefreshToken(args.refreshToken);
  }

  private async removeRefreshFromVerifiedRefreshToken(
    refreshToken: string,
  ): Promise<void> {
    try {
      const payload: JwtAuthPayload =
        await this.jwtService.verifyAsync<JwtAuthPayload>(refreshToken, {
          ignoreExpiration: false,
        });
      await this.refreshTokenService.removeRefreshToken({
        userId: payload.id,
      });
    } catch {
      return;
    }
  }

  /**
   * Retrieves a user's profile by their ID.
   * @param {string} userId - The ID of the user to retrieve.
   * @throws {NotFoundException} If the user is not found.
   * @returns {Promise<User>} The user profile if found.
   */
  async getProfile(
    userId: string,
  ): Promise<BaseResponseDto<ResponseFullUserDto>> {
    const user = await this.userService.findById(userId);

    if (!user) {
      throw new NotFoundException(ERROR_MESSAGES.USER.NOT_FOUND);
    }

    const userResponse = plainToInstance(ResponseFullUserDto, user, {
      excludeExtraneousValues: true,
      enableImplicitConversion: true,
    });
    return BaseResponseDto.ok(userResponse);
  }

  /**
   * Verifies an Auth0 JWT, ensures a user and user_providers row exist, then issues app tokens.
   * @param dto Request body containing the Auth0 access or ID token.
   * @returns Same shape as email/password login.
   */
  async exchangeToken(dto: TokenExchangeDto): Promise<LoginResponseDto> {
    const claims = await this.auth0TokenVerifier.verifyAndDecode(dto.token);
    const email = claims.email?.trim().toLowerCase();
    if (!email) {
      throw new BadRequestException(ERROR_MESSAGES.AUTH.EMAIL_MISSING);
    }
    if (claims.email_verified !== true) {
      throw new UnauthorizedException(ERROR_MESSAGES.AUTH.EMAIL_NOT_VERIFIED);
    }
    const linked = await this.userService.findUserProviderByIdentity({
      providerName: AUTH0_PROVIDER_NAME,
      providerUserId: claims.sub,
    });
    let user: User;
    if (linked) {
      user = await this.userService.findById(linked.user.id);
    } else {
      const existingByEmail = await this.userService.findByEmail(email);
      if (existingByEmail) {
        throw new BadRequestException(
          ERROR_MESSAGES.AUTH.ACCOUNT_LINK_REQUIRED,
        );
      } else {
        const { firstName, lastName } = splitNameFromAuth0Claims(claims);
        const userName =
          await this.userService.pickUniqueUserNameFromEmail(email);
        user = await this.userService.create({
          email,
          userName,
          firstName,
          lastName,
          userType: UserType.TRAINEE,
          role: UserRole.TRAINEE,
          approvalStatus: TrainerApprovalStatus.NONE,
          status: UserStatus.ACTIVE,
        });
        await this.notifyAdminsAboutNewUserRegistration({
          userName: user.userName,
          source: AUTH_PROVIDER_METHOD.Auth0,
          userId: user.id,
          email: user.email,
          userType: user.userType,
        });
        await this.userService.createUserProvider({
          userId: user.id,
          providerName: AUTH0_PROVIDER_NAME,
          providerUserId: claims.sub,
        });
      }
    }
    const payload: JwtAuthPayload = {
      id: user.id,
      email: user.email,
      userName: user.userName,
      role: user.role,
    };
    const {
      accessToken,
      refreshToken,
      accessTokenExpiresIn,
      refreshTokenExpiresIn,
    } = await this.createTokens(payload);
    await this.refreshTokenService.saveRefreshToken({
      userId: user.id,
      refreshToken,
    });
    const userResponse = plainToInstance(ResponseUserDto, user, {
      excludeExtraneousValues: true,
      enableImplicitConversion: true,
    });
    return {
      accessToken,
      refreshToken,
      user: userResponse,
      accessTokenExpiresIn,
      refreshTokenExpiresIn,
    };
  }

  /**
   * Links an Auth0 identity (sub) to an existing local account after verifying ownership via password.
   * Returns application tokens for the linked account.
   */
  async linkAuth0ToLocal(args: {
    readonly token: string;
    readonly password: string;
  }): Promise<LoginResponseDto> {
    const claims = await this.auth0TokenVerifier.verifyAndDecode(args.token);
    const email = claims.email?.trim().toLowerCase();
    if (!email) {
      throw new BadRequestException(ERROR_MESSAGES.AUTH.EMAIL_MISSING);
    }
    if (claims.email_verified !== true) {
      throw new UnauthorizedException(ERROR_MESSAGES.AUTH.EMAIL_NOT_VERIFIED);
    }
    const existingUser = await this.userService.findByEmail(email);
    if (!existingUser) {
      throw new NotFoundException(ERROR_MESSAGES.USER.NOT_FOUND);
    }
    if (!existingUser.password) {
      throw new BadRequestException(
        ERROR_MESSAGES.AUTH.PASSWORD_SETUP_REQUIRED,
      );
    }
    const isPasswordValid: boolean = await this.hashingService.compare(
      args.password,
      existingUser.password,
    );
    if (!isPasswordValid) {
      throw new BadRequestException(
        ERROR_MESSAGES.VALIDATION.PASSWORD_NOT_MATCH,
      );
    }
    const linked = await this.userService.findUserProviderByIdentity({
      providerName: AUTH0_PROVIDER_NAME,
      providerUserId: claims.sub,
    });
    if (linked && linked.user.id !== existingUser.id) {
      throw new ConflictException(ERROR_MESSAGES.USER.ALREADY_EXISTS);
    }
    if (!linked) {
      await this.userService.createUserProvider({
        userId: existingUser.id,
        providerName: AUTH0_PROVIDER_NAME,
        providerUserId: claims.sub,
      });
    }
    await this.userService.ensureLocalUserProviderForUser(existingUser);
    const payload: JwtAuthPayload = {
      id: existingUser.id,
      email: existingUser.email,
      userName: existingUser.userName,
      role: existingUser.role,
    };
    const {
      accessToken,
      refreshToken,
      accessTokenExpiresIn,
      refreshTokenExpiresIn,
    } = await this.createTokens(payload);
    await this.refreshTokenService.saveRefreshToken({
      userId: existingUser.id,
      refreshToken,
    });
    const userResponse = plainToInstance(ResponseUserDto, existingUser, {
      excludeExtraneousValues: true,
      enableImplicitConversion: true,
    });
    return {
      accessToken,
      refreshToken,
      user: userResponse,
      accessTokenExpiresIn,
      refreshTokenExpiresIn,
    };
  }

  /**
   * Sets an email/password credential for the current user (Auth0-first flow).
   * This enables future login via `/auth/login`.
   */
  async setPassword(args: {
    readonly userId: string;
    readonly newPassword: string;
  }): Promise<void> {
    const user = await this.userService.findById(args.userId);
    if (user.password) {
      throw new ConflictException(ERROR_MESSAGES.USER.ALREADY_EXISTS);
    }
    const hashedPassword = await this.hashingService.hash(args.newPassword);
    user.password = hashedPassword;
    await this.userService.saveUser(user);
    await this.userService.ensureLocalUserProviderForUser(user);
  }

  /**
   * Creates and returns an access token and a refresh token using the provided payload.
   * The access token is signed with the payload and expires in the time specified by
   * {@link TOKEN_EXPIRATION.ACCESS}.
   * The refresh token is signed with the payload and expires in the time specified by
   * {@link TOKEN_EXPIRATION.REFRESH}.
   * @param payload The payload to be signed into the tokens.
   * @returns A promise that resolves to an object containing the access token, refresh token, and expiration times.
   */
  private async createTokens(
    payload: JwtAuthPayload,
  ): Promise<
    TokensDto & { accessTokenExpiresIn: number; refreshTokenExpiresIn: number }
  > {
    const accessToken: string = await this.jwtService.signAsync(payload, {
      expiresIn: TOKEN_EXPIRATION.ACCESS,
    });
    const refreshToken: string = await this.jwtService.signAsync(payload, {
      expiresIn: TOKEN_EXPIRATION.REFRESH,
    });

    // Convert expiration strings to seconds
    const accessTokenExpiresIn: number = parseTokenExpirationStringToSeconds(
      TOKEN_EXPIRATION.ACCESS,
    );
    const refreshTokenExpiresIn: number = parseTokenExpirationStringToSeconds(
      TOKEN_EXPIRATION.REFRESH,
    );

    return {
      accessToken,
      refreshToken,
      accessTokenExpiresIn,
      refreshTokenExpiresIn,
    };
  }
}
