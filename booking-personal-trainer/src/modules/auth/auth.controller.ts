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
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiExtraModels,
  getSchemaPath,
} from '@nestjs/swagger';

// Commons
import { Public } from '../../common/decorators/public.decorator';
import {
  API_DESCRIPTIONS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
} from '../../common/constants/message.constant';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { Serialize } from '../../common/decorators/serialize.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { BaseResponseDto } from '../../common/dtos/base-response.dto';
import { Roles } from '../../common/decorators/role.decorator';
import { UserRole } from '../../common/enums/user/user.enum';
import { SWAGGER_ACCESS_TOKEN } from '../../common/constants/api-document.constants';

// Types
import type { JwtAuthPayload } from './types/jwt-auth.type';

// DTOs
import { RegisterDto } from './dtos/register.dto';
import { LoginDto, AuthResponseDataDto } from './dtos/login.dto';
import {
  RefreshTokenRequestDto,
  TokensDto,
  LogoutResponseDto,
} from './dtos/token.dto';
import { LogoutDto } from './dtos/logout.dto';
// TODO: Update naming for exchange api
import { Auth0ExchangeDto } from './dtos/auth0-exchange.dto';
import {
  ResponseFullUserDto,
  ResponseUserDto,
} from '../user/dtos/response-user.dto';

// Services
import { AuthService } from './auth.service';

// Rate limiting
import {
  createRateLimitByIdentityResolver,
  RATE_LIMIT_WINDOW_TTL_MILLISECONDS,
} from '../../common/helpers/rate-limit-override.helper';

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
  @ApiOperation({
    summary: API_DESCRIPTIONS.AUTH.REGISTER_SUMMARY,
    description: API_DESCRIPTIONS.AUTH.REGISTER_DESCRIPTION,
  })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: SUCCESS_MESSAGES.USER.CREATED,
    schema: {
      required: ['data'],
      properties: {
        data: { $ref: getSchemaPath(AuthResponseDataDto) },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: `${ERROR_MESSAGES.USER.EMAIL_TAKEN} or ${ERROR_MESSAGES.USER.USERNAME_TAKEN}`,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: ERROR_MESSAGES.AUTH.MISSING_REQUIRED_FIELDS,
  })
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
  @ApiOperation({
    summary: API_DESCRIPTIONS.AUTH.LOGIN_SUMMARY,
    description: API_DESCRIPTIONS.AUTH.LOGIN_DESCRIPTION,
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: SUCCESS_MESSAGES.USER.LOGGED_IN,
    schema: {
      required: ['data'],
      properties: {
        data: { $ref: getSchemaPath(AuthResponseDataDto) },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: ERROR_MESSAGES.USER.NOT_FOUND,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: ERROR_MESSAGES.VALIDATION.PASSWORD_NOT_MATCH,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: ERROR_MESSAGES.AUTH.MISSING_REQUIRED_FIELDS,
  })
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
  // TODO: Update naming for exchange api
  @Post('auth0/exchange')
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
  @ApiOperation({
    summary: API_DESCRIPTIONS.AUTH.AUTH0_EXCHANGE_SUMMARY,
    description: API_DESCRIPTIONS.AUTH.AUTH0_EXCHANGE_DESCRIPTION,
  })
  @ApiBody({ type: Auth0ExchangeDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: SUCCESS_MESSAGES.USER.LOGGED_IN,
    schema: {
      required: ['data'],
      properties: {
        data: { $ref: getSchemaPath(AuthResponseDataDto) },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: ERROR_MESSAGES.AUTH.INVALID_AUTH0_TOKEN,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: ERROR_MESSAGES.AUTH.AUTH0_EMAIL_MISSING,
  })
  // TODO: Update naming for exchange api
  async exchangeAuth0(
    @Body() data: Auth0ExchangeDto,
  ): Promise<BaseResponseDto<AuthResponseDataDto>> {
    const {
      accessToken,
      refreshToken,
      user,
      accessTokenExpiresIn,
      refreshTokenExpiresIn,
    } = await this.authService.exchangeAuth0Token(data);

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
  @ApiOperation({
    summary: API_DESCRIPTIONS.AUTH.REFRESH_TOKEN_SUMMARY,
    description: API_DESCRIPTIONS.AUTH.REFRESH_TOKEN_DESCRIPTION,
  })
  @ApiBody({ type: RefreshTokenRequestDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: SUCCESS_MESSAGES.AUTH.TOKEN_REFRESHED,
    type: TokensDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: ERROR_MESSAGES.AUTH.REFRESH_TOKEN_REQUIRED,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: ERROR_MESSAGES.AUTH.INVALID_REFRESH_TOKEN,
  })
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
  @ApiOperation({
    summary: API_DESCRIPTIONS.AUTH.LOGOUT_SUMMARY,
    description: API_DESCRIPTIONS.AUTH.LOGOUT_DESCRIPTION,
  })
  @ApiBody({ type: LogoutDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: SUCCESS_MESSAGES.AUTH.LOGGED_OUT,
    type: LogoutResponseDto,
  })
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
  @ApiOperation({
    summary: API_DESCRIPTIONS.AUTH.PROFILE_SUMMARY,
    description: API_DESCRIPTIONS.AUTH.PROFILE_DESCRIPTION,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: SUCCESS_MESSAGES.USER.PROFILE_RETRIEVED,
    schema: {
      required: ['data'],
      properties: {
        data: { $ref: getSchemaPath(ResponseFullUserDto) },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: ERROR_MESSAGES.AUTH.ACCESS_TOKEN_INVALID,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: ERROR_MESSAGES.USER.NOT_FOUND,
  })
  async getProfile(
    @CurrentUser() user: JwtAuthPayload,
  ): Promise<BaseResponseDto<ResponseFullUserDto>> {
    return this.authService.getProfile(user.id);
  }
}
