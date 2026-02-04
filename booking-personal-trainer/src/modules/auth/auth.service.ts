import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

// Commons
import { ERROR_MESSAGES } from '../../common/constants/message.constant';
import { TOKEN_EXPIRATION } from '../../common/constants/token.constants';

// Types
import { JwtAuthPayload } from './types/jwt-auth.type';

// DTOs
import { RegisterDto } from './dtos/register.dto';
import { ResponseUserDto } from '../user/dtos/response-user.dto';
import { LoginDto, LoginResponseDto } from './dtos/login.dto';
import { RefreshTokenRequestDto, TokensDto } from './dtos/token.dto';
import { LogoutDto } from './dtos/logout.dto';

// Services
import { UserService } from '../user/user.service';
import { HashingService } from './services/hashing.service';
import { RefreshTokenService } from './services/refresh-token.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly hashingService: HashingService,
    private readonly refreshTokenService: RefreshTokenService,
  ) {}

  async register(data: RegisterDto): Promise<ResponseUserDto> {
    const {
      email,
      password,
      userName,
      userType,
      firstName,
      lastName,
      role,
      approvalStatus,
      status,
    } = data;

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

    const newUser: ResponseUserDto = await this.userService.create({
      email,
      password: hashedPassword,
      userName,
      userType,
      firstName,
      lastName,
      role,
      approvalStatus,
      status,
    });

    return newUser;
  }

  async login(data: LoginDto): Promise<LoginResponseDto> {
    const { email, password } = data;

    const existingUser = await this.userService.findByEmailOrUserName(email);

    if (!existingUser) {
      throw new NotFoundException(ERROR_MESSAGES.USER.NOT_FOUND);
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

    const payload: JwtAuthPayload = {
      id: existingUser.id,
      email: existingUser.email,
      userName: existingUser.userName,
      role: existingUser.role,
    };

    const { accessToken, refreshToken } = await this.createTokens(payload);

    await this.refreshTokenService.saveRefreshToken({
      userId: existingUser.id,
      refreshToken,
    });

    const responseUser: ResponseUserDto = {
      userName: existingUser.userName,
      email: existingUser.email,
      firstName: existingUser.firstName,
      lastName: existingUser.lastName,
      role: existingUser.role,
      userType: existingUser.userType,
      approvalStatus: existingUser.approvalStatus,
      status: existingUser.status,
    };

    return { accessToken, refreshToken, user: responseUser };
  }

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

  // TODO: Need to refactor
  /**
   * Logs out the user by removing the refresh token from Redis.
   * @param {LogoutDto} args - The arguments to logout the user.
   * @returns A promise that resolves when the refresh token has been removed.
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

    try {
      const payload: JwtAuthPayload =
        await this.jwtService.verifyAsync<JwtAuthPayload>(args.refreshToken, {
          ignoreExpiration: false,
        });
      await this.refreshTokenService.removeRefreshToken({
        userId: payload.id,
      });
    } catch {
      return;
    }
  }

  async getProfile(userId: string) {
    const user = await this.userService.findById(userId);

    if (!user) {
      throw new NotFoundException(ERROR_MESSAGES.USER.NOT_FOUND);
    }

    return user;
  }

  /**
   * Creates and returns an access token and a refresh token using the provided payload.
   * The access token is signed with the payload and expires in the time specified by
   * {@link TOKEN_EXPIRATION.ACCESS}.
   * The refresh token is signed with the payload and expires in the time specified by
   * {@link TOKEN_EXPIRATION.REFRESH}.
   * @param payload The payload to be signed into the tokens.
   * @returns A promise that resolves to an object containing the access token and the refresh token.
   */
  private async createTokens(
    payload: JwtAuthPayload,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const accessToken: string = await this.jwtService.signAsync(payload, {
      expiresIn: TOKEN_EXPIRATION.ACCESS,
    });
    const refreshToken: string = await this.jwtService.signAsync(payload, {
      expiresIn: TOKEN_EXPIRATION.REFRESH,
    });

    return { accessToken, refreshToken };
  }
}
