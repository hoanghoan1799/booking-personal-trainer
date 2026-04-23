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
} from '@nestjs/swagger';

// Commons
import { Public } from '../../../common/decorators/public.decorator';
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
import { RefreshTokenRequestDto, TokensDto } from '../dtos/token.dto';
import { LogoutDto } from '../dtos/logout.dto';
import { TokenExchangeDto } from '../dtos/token-exchange.dto';
import { LinkAuth0ToLocalDto } from '../dtos/link-auth0-to-local.dto';
import { SetPasswordDto } from '../dtos/set-password.dto';
import { ResponseFullUserDto } from '../../user/dtos/response-user.dto';

// Services
import { AuthService } from '../services/auth.service';
import { AuthSwagger } from '../constants/auth-swagger.constants';

// Rate limiting
import {
  createRateLimitByIdentityResolver,
  RATE_LIMIT_WINDOW_TTL_MILLISECONDS,
} from '../../../common/helpers/rate-limit-override.helper';

@ApiTags('Auth')
@ApiExtraModels(
  AuthSwagger.Controller.ApiExtraModels.User,
  AuthSwagger.Controller.ApiExtraModels.FullUser,
  AuthSwagger.Controller.ApiExtraModels.AuthResponseData,
)
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
  @ApiOperation(AuthSwagger.Controller.ApiOperation.Register)
  @ApiBody(AuthSwagger.Controller.ApiBody.Register)
  @ApiResponse(AuthSwagger.Controller.ApiResponse.RegisterCreated)
  @ApiResponse(AuthSwagger.Controller.ApiResponse.RegisterConflict)
  @ApiResponse(AuthSwagger.Controller.ApiResponse.RegisterBadRequest)
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
  @ApiOperation(AuthSwagger.Controller.ApiOperation.Login)
  @ApiBody(AuthSwagger.Controller.ApiBody.Login)
  @ApiResponse(AuthSwagger.Controller.ApiResponse.LoginOk)
  @ApiResponse(AuthSwagger.Controller.ApiResponse.LoginNotFound)
  @ApiResponse(AuthSwagger.Controller.ApiResponse.LoginPasswordNotMatch)
  @ApiResponse(AuthSwagger.Controller.ApiResponse.LoginMissingRequiredFields)
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
  @ApiOperation(AuthSwagger.Controller.ApiOperation.TokenExchange)
  @ApiBody(AuthSwagger.Controller.ApiBody.TokenExchange)
  @ApiResponse(AuthSwagger.Controller.ApiResponse.TokenExchangeOk)
  @ApiResponse(AuthSwagger.Controller.ApiResponse.TokenExchangeUnauthorized)
  @ApiResponse(
    AuthSwagger.Controller.ApiResponse.TokenExchangeBadRequestEmailMissing,
  )
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
  @ApiOperation(AuthSwagger.Controller.ApiOperation.LinkAuth0)
  @ApiBody(AuthSwagger.Controller.ApiBody.LinkAuth0)
  @ApiResponse(AuthSwagger.Controller.ApiResponse.LinkAuth0Ok)
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
  @ApiOperation(AuthSwagger.Controller.ApiOperation.SetPassword)
  @ApiBody(AuthSwagger.Controller.ApiBody.SetPassword)
  @ApiResponse(AuthSwagger.Controller.ApiResponse.SetPasswordNoContent)
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
  @ApiOperation(AuthSwagger.Controller.ApiOperation.RefreshToken)
  @ApiBody(AuthSwagger.Controller.ApiBody.RefreshToken)
  @ApiResponse(AuthSwagger.Controller.ApiResponse.RefreshTokenOk)
  @ApiResponse(
    AuthSwagger.Controller.ApiResponse.RefreshTokenBadRequestRequired,
  )
  @ApiResponse(
    AuthSwagger.Controller.ApiResponse.RefreshTokenUnauthorizedInvalid,
  )
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
  @ApiOperation(AuthSwagger.Controller.ApiOperation.Logout)
  @ApiBody(AuthSwagger.Controller.ApiBody.Logout)
  @ApiResponse(AuthSwagger.Controller.ApiResponse.LogoutOk)
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
  @ApiOperation(AuthSwagger.Controller.ApiOperation.Profile)
  @ApiResponse(AuthSwagger.Controller.ApiResponse.ProfileOk)
  @ApiResponse(AuthSwagger.Controller.ApiResponse.ProfileUnauthorized)
  @ApiResponse(AuthSwagger.Controller.ApiResponse.ProfileNotFound)
  async getProfile(
    @CurrentUser() user: JwtAuthPayload,
  ): Promise<BaseResponseDto<ResponseFullUserDto>> {
    return this.authService.getProfile(user.id);
  }
}
