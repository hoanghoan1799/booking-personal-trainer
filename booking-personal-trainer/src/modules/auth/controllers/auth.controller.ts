import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  ApiBearerAuth,
  ApiBody,
  ApiExtraModels,
  ApiOperation,
  ApiResponse,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';

// Commons
import { Public } from '../../../common/decorators/public.decorator';
import {
  API_DESCRIPTIONS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
} from '../../../common/constants/message.constant';
import { CurrentUser } from '../../../common/decorators/user.decorator';
import { Serialize } from '../../../common/decorators/serialize.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { BaseResponseDto } from '../../../common/dtos/base-response.dto';
import { Roles } from '../../../common/decorators/role.decorator';
import { UserRole } from '../../../common/enums/user/user.enum';
import { SWAGGER_ACCESS_TOKEN } from '../../../common/constants/api-document.constants';

// Types
import type { JwtAuthPayload } from '../types/jwt-auth.type';

// DTOs
import { RegisterDto } from '../dtos/register.dto';
import { LoginDto, AuthResponseDataDto } from '../dtos/login.dto';
import {
  RefreshTokenRequestDto,
  TokensDto,
  LogoutResponseDto,
} from '../dtos/token.dto';
import { LogoutDto } from '../dtos/logout.dto';
import { TokenExchangeDto } from '../dtos/token-exchange.dto';
import { LinkAuth0ToLocalDto } from '../dtos/link-auth0-to-local.dto';
import { SetPasswordDto } from '../dtos/set-password.dto';
import {
  ResponseFullUserDto,
  ResponseUserDto,
} from '../../user/dtos/response-user.dto';

// Services
import { AuthService } from '../services/auth.service';

// Rate limiting
import {
  createRateLimitByIdentityResolver,
  RATE_LIMIT_WINDOW_TTL_MILLISECONDS,
} from '../../../common/helpers/rate-limit-override.helper';

const API_BODY_REGISTER = { type: RegisterDto } as const;
const API_BODY_LOGIN = { type: LoginDto } as const;
const API_BODY_TOKEN_EXCHANGE = { type: TokenExchangeDto } as const;
const API_BODY_LINK_AUTH0 = { type: LinkAuth0ToLocalDto } as const;
const API_BODY_SET_PASSWORD = { type: SetPasswordDto } as const;
const API_BODY_REFRESH_TOKEN = { type: RefreshTokenRequestDto } as const;
const API_BODY_LOGOUT = { type: LogoutDto } as const;

const API_OPERATION_REGISTER = {
  summary: API_DESCRIPTIONS.AUTH.REGISTER_SUMMARY,
  description: API_DESCRIPTIONS.AUTH.REGISTER_DESCRIPTION,
} as const;

const API_RESPONSE_REGISTER_CREATED = {
  status: HttpStatus.CREATED,
  description: SUCCESS_MESSAGES.USER.CREATED,
  schema: {
    required: ['data'],
    properties: {
      data: { $ref: getSchemaPath(AuthResponseDataDto) },
    },
  },
} as const;

const API_RESPONSE_REGISTER_CONFLICT = {
  status: HttpStatus.CONFLICT,
  description: `${ERROR_MESSAGES.USER.EMAIL_TAKEN} or ${ERROR_MESSAGES.USER.USERNAME_TAKEN}`,
} as const;

const API_RESPONSE_REGISTER_BAD_REQUEST = {
  status: HttpStatus.BAD_REQUEST,
  description: ERROR_MESSAGES.AUTH.MISSING_REQUIRED_FIELDS,
} as const;

const API_OPERATION_LOGIN = {
  summary: API_DESCRIPTIONS.AUTH.LOGIN_SUMMARY,
  description: API_DESCRIPTIONS.AUTH.LOGIN_DESCRIPTION,
} as const;

const API_RESPONSE_LOGIN_OK = {
  status: HttpStatus.OK,
  description: SUCCESS_MESSAGES.USER.LOGGED_IN,
  schema: {
    required: ['data'],
    properties: {
      data: { $ref: getSchemaPath(AuthResponseDataDto) },
    },
  },
} as const;

const API_RESPONSE_LOGIN_NOT_FOUND = {
  status: HttpStatus.NOT_FOUND,
  description: ERROR_MESSAGES.USER.NOT_FOUND,
} as const;

const API_RESPONSE_LOGIN_PASSWORD_NOT_MATCH = {
  status: HttpStatus.BAD_REQUEST,
  description: ERROR_MESSAGES.VALIDATION.PASSWORD_NOT_MATCH,
} as const;

const API_RESPONSE_LOGIN_MISSING_REQUIRED_FIELDS = {
  status: HttpStatus.BAD_REQUEST,
  description: ERROR_MESSAGES.AUTH.MISSING_REQUIRED_FIELDS,
} as const;

const API_OPERATION_TOKEN_EXCHANGE = {
  summary: API_DESCRIPTIONS.AUTH.TOKEN_EXCHANGE_SUMMARY,
  description: API_DESCRIPTIONS.AUTH.TOKEN_EXCHANGE_DESCRIPTION,
} as const;

const API_RESPONSE_TOKEN_EXCHANGE_OK = {
  status: HttpStatus.OK,
  description: SUCCESS_MESSAGES.USER.LOGGED_IN,
  schema: {
    required: ['data'],
    properties: {
      data: { $ref: getSchemaPath(AuthResponseDataDto) },
    },
  },
} as const;

const API_RESPONSE_TOKEN_EXCHANGE_UNAUTHORIZED = {
  status: HttpStatus.UNAUTHORIZED,
  description: ERROR_MESSAGES.AUTH.INVALID_TOKEN,
} as const;

const API_RESPONSE_TOKEN_EXCHANGE_BAD_REQUEST_EMAIL_MISSING = {
  status: HttpStatus.BAD_REQUEST,
  description: ERROR_MESSAGES.AUTH.EMAIL_MISSING,
} as const;

const API_OPERATION_LINK_AUTH0 = {
  summary: 'Link Auth0 to existing local account',
  description:
    'Verifies third-party JWT and links it to an existing local user after password verification, then returns application tokens.',
} as const;

const API_RESPONSE_LINK_AUTH0_OK = {
  status: HttpStatus.OK,
  description: SUCCESS_MESSAGES.USER.LOGGED_IN,
  schema: {
    required: ['data'],
    properties: {
      data: { $ref: getSchemaPath(AuthResponseDataDto) },
    },
  },
} as const;

const API_OPERATION_SET_PASSWORD = {
  summary: 'Create password for current user',
  description:
    'Allows Auth0-first users to create a password so they can log in with email/password next time.',
} as const;

const API_RESPONSE_SET_PASSWORD_NO_CONTENT = {
  status: HttpStatus.NO_CONTENT,
  description: 'Password created successfully',
} as const;

const API_OPERATION_REFRESH_TOKEN = {
  summary: API_DESCRIPTIONS.AUTH.REFRESH_TOKEN_SUMMARY,
  description: API_DESCRIPTIONS.AUTH.REFRESH_TOKEN_DESCRIPTION,
} as const;

const API_RESPONSE_REFRESH_TOKEN_OK = {
  status: HttpStatus.OK,
  description: SUCCESS_MESSAGES.AUTH.TOKEN_REFRESHED,
  type: TokensDto,
} as const;

const API_RESPONSE_REFRESH_TOKEN_BAD_REQUEST_REQUIRED = {
  status: HttpStatus.BAD_REQUEST,
  description: ERROR_MESSAGES.AUTH.REFRESH_TOKEN_REQUIRED,
} as const;

const API_RESPONSE_REFRESH_TOKEN_UNAUTHORIZED_INVALID = {
  status: HttpStatus.UNAUTHORIZED,
  description: ERROR_MESSAGES.AUTH.INVALID_REFRESH_TOKEN,
} as const;

const API_OPERATION_LOGOUT = {
  summary: API_DESCRIPTIONS.AUTH.LOGOUT_SUMMARY,
  description: API_DESCRIPTIONS.AUTH.LOGOUT_DESCRIPTION,
} as const;

const API_RESPONSE_LOGOUT_OK = {
  status: HttpStatus.OK,
  description: SUCCESS_MESSAGES.AUTH.LOGGED_OUT,
  type: LogoutResponseDto,
} as const;

const API_OPERATION_PROFILE = {
  summary: API_DESCRIPTIONS.AUTH.PROFILE_SUMMARY,
  description: API_DESCRIPTIONS.AUTH.PROFILE_DESCRIPTION,
} as const;

const API_RESPONSE_PROFILE_OK = {
  status: HttpStatus.OK,
  description: SUCCESS_MESSAGES.USER.PROFILE_RETRIEVED,
  schema: {
    required: ['data'],
    properties: {
      data: { $ref: getSchemaPath(ResponseFullUserDto) },
    },
  },
} as const;

const API_RESPONSE_PROFILE_UNAUTHORIZED = {
  status: HttpStatus.UNAUTHORIZED,
  description: ERROR_MESSAGES.AUTH.ACCESS_TOKEN_INVALID,
} as const;

const API_RESPONSE_PROFILE_NOT_FOUND = {
  status: HttpStatus.NOT_FOUND,
  description: ERROR_MESSAGES.USER.NOT_FOUND,
} as const;

@ApiTags('Auth')
@ApiExtraModels(ResponseUserDto, ResponseFullUserDto, AuthResponseDataDto)
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  /**
   * Rate-limit override (stricter than global baseline).
   *
   * Why:
   * - `register` is a common abuse target (bot signups, email/username probing, DB spam).
   * - Stricter limits reduce load and slow down automated account creation attempts.
   *
   * How it applies:
   * - Still keyed by user/token/ip (via `createRateLimitByIdentityResolver`), but with lower limits.
   */
  @Throttle({
    burst: {
      ttl: RATE_LIMIT_WINDOW_TTL_MILLISECONDS.BURST,
      limit: createRateLimitByIdentityResolver({ ip: 3, token: 5, user: 5 }),
    },
    minute: {
      ttl: RATE_LIMIT_WINDOW_TTL_MILLISECONDS.MINUTE,
      limit: createRateLimitByIdentityResolver({ ip: 10, token: 20, user: 20 }),
    },
    hour: {
      ttl: RATE_LIMIT_WINDOW_TTL_MILLISECONDS.HOUR,
      limit: createRateLimitByIdentityResolver({
        ip: 60,
        token: 120,
        user: 120,
      }),
    },
  })
  @ApiOperation(API_OPERATION_REGISTER)
  @ApiBody(API_BODY_REGISTER)
  @ApiResponse(API_RESPONSE_REGISTER_CREATED)
  @ApiResponse(API_RESPONSE_REGISTER_CONFLICT)
  @ApiResponse(API_RESPONSE_REGISTER_BAD_REQUEST)
  async create(
    @Body() data: RegisterDto,
  ): Promise<BaseResponseDto<AuthResponseDataDto>> {
    const {
      accessToken,
      refreshToken,
      user,
      accessTokenExpiresIn,
      refreshTokenExpiresIn,
    } = await this.authService.register(data);
    const responseData: AuthResponseDataDto = {
      user,
      accessToken,
      refreshToken,
      accessTokenExpiresIn,
      refreshTokenExpiresIn,
    };
    return BaseResponseDto.ok(responseData);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  /**
   * Rate-limit override (stricter than global baseline).
   *
   * Why:
   * - `login` is the primary brute-force / credential-stuffing target.
   * - Stricter limits reduce password-guessing rate and protect downstream dependencies (DB/Redis).
   *
   * Notes:
   * - This is complementary to strong password policy + lockouts; rate limiting is your first line of defense.
   */
  @Throttle({
    burst: {
      ttl: RATE_LIMIT_WINDOW_TTL_MILLISECONDS.BURST,
      limit: createRateLimitByIdentityResolver({ ip: 5, token: 8, user: 8 }),
    },
    minute: {
      ttl: RATE_LIMIT_WINDOW_TTL_MILLISECONDS.MINUTE,
      limit: createRateLimitByIdentityResolver({ ip: 15, token: 30, user: 30 }),
    },
    hour: {
      ttl: RATE_LIMIT_WINDOW_TTL_MILLISECONDS.HOUR,
      limit: createRateLimitByIdentityResolver({
        ip: 120,
        token: 240,
        user: 240,
      }),
    },
  })
  @ApiOperation(API_OPERATION_LOGIN)
  @ApiBody(API_BODY_LOGIN)
  @ApiResponse(API_RESPONSE_LOGIN_OK)
  @ApiResponse(API_RESPONSE_LOGIN_NOT_FOUND)
  @ApiResponse(API_RESPONSE_LOGIN_PASSWORD_NOT_MATCH)
  @ApiResponse(API_RESPONSE_LOGIN_MISSING_REQUIRED_FIELDS)
  async login(
    @Body() data: LoginDto,
  ): Promise<BaseResponseDto<AuthResponseDataDto>> {
    const {
      accessToken,
      refreshToken,
      user,
      accessTokenExpiresIn,
      refreshTokenExpiresIn,
    } = await this.authService.login(data);
    const responseData: AuthResponseDataDto = {
      user,
      accessToken,
      refreshToken,
      accessTokenExpiresIn,
      refreshTokenExpiresIn,
    };
    return BaseResponseDto.ok(responseData);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('token-exchange')
  @Throttle({
    burst: {
      ttl: RATE_LIMIT_WINDOW_TTL_MILLISECONDS.BURST,
      limit: createRateLimitByIdentityResolver({ ip: 5, token: 8, user: 8 }),
    },
    minute: {
      ttl: RATE_LIMIT_WINDOW_TTL_MILLISECONDS.MINUTE,
      limit: createRateLimitByIdentityResolver({ ip: 15, token: 30, user: 30 }),
    },
    hour: {
      ttl: RATE_LIMIT_WINDOW_TTL_MILLISECONDS.HOUR,
      limit: createRateLimitByIdentityResolver({
        ip: 120,
        token: 240,
        user: 240,
      }),
    },
  })
  @ApiOperation(API_OPERATION_TOKEN_EXCHANGE)
  @ApiBody(API_BODY_TOKEN_EXCHANGE)
  @ApiResponse(API_RESPONSE_TOKEN_EXCHANGE_OK)
  @ApiResponse(API_RESPONSE_TOKEN_EXCHANGE_UNAUTHORIZED)
  @ApiResponse(API_RESPONSE_TOKEN_EXCHANGE_BAD_REQUEST_EMAIL_MISSING)
  async tokenExchange(
    @Body() data: TokenExchangeDto,
  ): Promise<BaseResponseDto<AuthResponseDataDto>> {
    const {
      accessToken,
      refreshToken,
      user,
      accessTokenExpiresIn,
      refreshTokenExpiresIn,
    } = await this.authService.exchangeToken(data);
    const responseData: AuthResponseDataDto = {
      user,
      accessToken,
      refreshToken,
      accessTokenExpiresIn,
      refreshTokenExpiresIn,
    };
    return BaseResponseDto.ok(responseData);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('link-auth0')
  @Throttle({
    burst: {
      ttl: RATE_LIMIT_WINDOW_TTL_MILLISECONDS.BURST,
      limit: createRateLimitByIdentityResolver({ ip: 5, token: 8, user: 8 }),
    },
    minute: {
      ttl: RATE_LIMIT_WINDOW_TTL_MILLISECONDS.MINUTE,
      limit: createRateLimitByIdentityResolver({ ip: 15, token: 30, user: 30 }),
    },
    hour: {
      ttl: RATE_LIMIT_WINDOW_TTL_MILLISECONDS.HOUR,
      limit: createRateLimitByIdentityResolver({
        ip: 120,
        token: 240,
        user: 240,
      }),
    },
  })
  @ApiOperation(API_OPERATION_LINK_AUTH0)
  @ApiBody(API_BODY_LINK_AUTH0)
  @ApiResponse(API_RESPONSE_LINK_AUTH0_OK)
  async linkAuth0(
    @Body() data: LinkAuth0ToLocalDto,
  ): Promise<BaseResponseDto<AuthResponseDataDto>> {
    const {
      accessToken,
      refreshToken,
      user,
      accessTokenExpiresIn,
      refreshTokenExpiresIn,
    } = await this.authService.linkAuth0ToLocal({
      token: data.token,
      password: data.password,
    });
    const responseData: AuthResponseDataDto = {
      user,
      accessToken,
      refreshToken,
      accessTokenExpiresIn,
      refreshTokenExpiresIn,
    };
    return BaseResponseDto.ok(responseData);
  }

  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN, UserRole.TRAINEE, UserRole.TRAINER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('password')
  @ApiBearerAuth(SWAGGER_ACCESS_TOKEN)
  @ApiOperation(API_OPERATION_SET_PASSWORD)
  @ApiBody(API_BODY_SET_PASSWORD)
  @ApiResponse(API_RESPONSE_SET_PASSWORD_NO_CONTENT)
  async setPassword(
    @CurrentUser() user: JwtAuthPayload,
    @Body() data: SetPasswordDto,
  ): Promise<void> {
    await this.authService.setPassword({
      userId: user.id,
      newPassword: data.newPassword,
    });
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('token/refresh')
  /**
   * Rate-limit override (moderate).
   *
   * Why:
   * - Refresh endpoints can be hammered by buggy clients or attackers to generate load.
   * - We keep it more permissive than `login`, but still below global defaults to protect auth storage.
   */
  @Throttle({
    burst: {
      ttl: RATE_LIMIT_WINDOW_TTL_MILLISECONDS.BURST,
      limit: createRateLimitByIdentityResolver({ ip: 10, token: 15, user: 15 }),
    },
    minute: {
      ttl: RATE_LIMIT_WINDOW_TTL_MILLISECONDS.MINUTE,
      limit: createRateLimitByIdentityResolver({ ip: 60, token: 90, user: 90 }),
    },
    hour: {
      ttl: RATE_LIMIT_WINDOW_TTL_MILLISECONDS.HOUR,
      limit: createRateLimitByIdentityResolver({
        ip: 500,
        token: 800,
        user: 800,
      }),
    },
  })
  @ApiOperation(API_OPERATION_REFRESH_TOKEN)
  @ApiBody(API_BODY_REFRESH_TOKEN)
  @ApiResponse(API_RESPONSE_REFRESH_TOKEN_OK)
  @ApiResponse(API_RESPONSE_REFRESH_TOKEN_BAD_REQUEST_REQUIRED)
  @ApiResponse(API_RESPONSE_REFRESH_TOKEN_UNAUTHORIZED_INVALID)
  async refresh(@Body() data: RefreshTokenRequestDto): Promise<TokensDto> {
    return this.authService.refreshTokens({ refreshToken: data.refreshToken });
  }

  @Public()
  @Post('logout')
  /**
   * Rate-limit override (moderate).
   *
   * Why:
   * - Logout can be spammed to cause unnecessary storage/cookie churn.
   * - Keeping a moderate limit prevents rapid repeated calls while remaining user-friendly.
   */
  @Throttle({
    burst: {
      ttl: RATE_LIMIT_WINDOW_TTL_MILLISECONDS.BURST,
      limit: createRateLimitByIdentityResolver({ ip: 20, token: 40, user: 40 }),
    },
    minute: {
      ttl: RATE_LIMIT_WINDOW_TTL_MILLISECONDS.MINUTE,
      limit: createRateLimitByIdentityResolver({
        ip: 120,
        token: 240,
        user: 240,
      }),
    },
  })
  @ApiOperation(API_OPERATION_LOGOUT)
  @ApiBody(API_BODY_LOGOUT)
  @ApiResponse(API_RESPONSE_LOGOUT_OK)
  async logout(@Body() data: LogoutDto = {}): Promise<{ success: boolean }> {
    await this.authService.logout({
      refreshToken: data.refreshToken,
    });
    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN, UserRole.TRAINEE, UserRole.TRAINER)
  @Get('profile')
  @Serialize(ResponseFullUserDto)
  @ApiBearerAuth(SWAGGER_ACCESS_TOKEN)
  @ApiOperation(API_OPERATION_PROFILE)
  @ApiResponse(API_RESPONSE_PROFILE_OK)
  @ApiResponse(API_RESPONSE_PROFILE_UNAUTHORIZED)
  @ApiResponse(API_RESPONSE_PROFILE_NOT_FOUND)
  async getProfile(
    @CurrentUser() user: JwtAuthPayload,
  ): Promise<BaseResponseDto<ResponseFullUserDto>> {
    return this.authService.getProfile(user.id);
  }
}
