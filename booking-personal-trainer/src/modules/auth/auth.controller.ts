import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Response, Request } from 'express';

// Commons
import { Public } from '../../common/decorators/public.decorator';
import {
  TOKEN_COOKIE,
  TOKEN_MAX_AGE,
} from '../../common/constants/token.constants';
import { ROUTES, ROUTE_PREFIX } from '../../common/constants/route.constant';
import { COOKIE_OPTIONS } from '../../common/constants/cookie.constant';
import { ERROR_MESSAGES } from '../../common/constants/message.constant';
import { Cookie } from '../../common/decorators/cookie.decorator';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { Serialize } from '../../common/decorators/serialize.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { BaseResponseDto } from '../../common/dtos/base-response.dto';
import { Roles } from '../../common/decorators/role.decorator';
import { UserRole } from '../../common/enums/user/user.enum';

// DTOs
import { RegisterDto } from './dtos/register.dto';
import { LoginDto } from './dtos/login.dto';
import { ResponseUserDto } from '../user/dtos/response-user.dto';

// Services
import { AuthService } from './auth.service';
import type { JwtAuthPayload } from './types/jwt-auth.type';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @Serialize(ResponseUserDto)
  /**
   * Registers a new user.
   * @param data The user data to be registered.
   * @returns The newly registered user.
   */
  async create(
    @Body() data: RegisterDto,
  ): Promise<BaseResponseDto<ResponseUserDto>> {
    return this.authService.register(data);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  @Serialize(ResponseUserDto)
  /**
   * Logs in the user.
   * @param data The user data to be logged in.
   * @returns The logged in user.
   */
  async login(
    @Body() data: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<BaseResponseDto<ResponseUserDto>> {
    const { accessToken, refreshToken, user } =
      await this.authService.login(data);

    res.cookie(TOKEN_COOKIE.ACCESS, accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: TOKEN_MAX_AGE.ACCESS,
    });

    res.cookie(TOKEN_COOKIE.REFRESH, refreshToken, {
      ...COOKIE_OPTIONS,
      path: `${ROUTE_PREFIX.V1}${ROUTES.TOKEN_REFRESH}`,
      maxAge: TOKEN_MAX_AGE.REFRESH,
    });

    return BaseResponseDto.ok(user);
  }

  @HttpCode(HttpStatus.OK)
  @Post('token/refresh')
  /**
   * Refreshes the access token and refresh token.
   * @throws UnauthorizedException if refresh token is not found
   * @returns {Promise<void>} with the new access token and its expiration time in seconds
   */
  async refresh(
    @Res({ passthrough: true })
    res: Response,
    @Cookie(TOKEN_COOKIE.REFRESH) refreshTokenFromCookie?: string,
  ): Promise<void> {
    if (!refreshTokenFromCookie) {
      throw new UnauthorizedException(
        ERROR_MESSAGES.AUTH.REFRESH_TOKEN_NOT_FOUND,
      );
    }

    const { accessToken, refreshToken } = await this.authService.refreshTokens({
      refreshToken: refreshTokenFromCookie,
    });

    res.cookie(TOKEN_COOKIE.REFRESH, refreshToken, {
      ...COOKIE_OPTIONS,
      path: `${ROUTE_PREFIX.V1}${ROUTES.TOKEN_REFRESH}`,
      maxAge: TOKEN_MAX_AGE.REFRESH,
    });

    res.cookie(TOKEN_COOKIE.ACCESS, accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: TOKEN_MAX_AGE.ACCESS,
    });

    return;
  }

  @Post('logout')
  /**
   * Logs out the user.
   * @param req The request object
   * @param res The response object
   * @returns A promise that resolves to a JSON object with a success property set to true
   */
  async logout(
    @Res({ passthrough: true }) res: Response,
    @Cookie(TOKEN_COOKIE.REFRESH) refreshTokenFromCookie?: string,
  ): Promise<{ success: boolean }> {
    await this.authService.logout({
      refreshToken: refreshTokenFromCookie,
    });

    res.clearCookie(TOKEN_COOKIE.ACCESS, { path: ROUTES.ROOT });
    res.clearCookie(TOKEN_COOKIE.REFRESH, { path: ROUTES.ROOT });
    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN, UserRole.TRAINEE, UserRole.TRAINER)
  @Get('profile')
  @Serialize(ResponseUserDto)
  /**
   * Gets the profile of the current user.
   * @throws NotFoundException if user is not found
   * @returns The profile of the current user
   */
  async getProfile(
    @CurrentUser() user: JwtAuthPayload,
  ): Promise<BaseResponseDto<ResponseUserDto>> {
    return this.authService.getProfile(user.id);
  }
}
