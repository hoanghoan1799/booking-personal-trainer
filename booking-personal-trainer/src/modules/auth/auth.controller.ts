import {
  Body,
  Controller,
  Get,
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
import { ROUTES } from '../../common/constants/route.constant';
import {
  COOKIE_OPTIONS,
  COOKIE_SAME_SITE,
} from '../../common/constants/cookie.constant';
import { ERROR_MESSAGES } from '../../common/constants/message.constant';
import { Cookie } from '../../common/decorators/cookie.decorator';
import { CurrentUser } from '../../common/decorators/user.decorator';

// DTOs
import { RegisterDto } from './dtos/register.dto';
import { LoginDto } from './dtos/login.dto';
import { TokenResponseDto } from './dtos/token.dto';

// Services
import { AuthService } from './auth.service';
import type { JwtAuthPayload } from './types/jwt-auth.type';

// Guards
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  /**
   * Registers a new user.
   * @param data The user data to be registered.
   * @returns The newly registered user.
   */
  async create(@Body() data: RegisterDto) {
    return this.authService.register(data);
  }

  @Public()
  @Post('login')
  /**
   * Logs in the user.
   * @param data The user data to be logged in.
   * @returns The logged in user.
   */
  async login(
    @Body() data: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken, user } =
      await this.authService.login(data);

    res.cookie(TOKEN_COOKIE.ACCESS, accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: TOKEN_MAX_AGE.ACCESS,
    });

    res.cookie(TOKEN_COOKIE.REFRESH, refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: TOKEN_MAX_AGE.REFRESH,
    });

    return user;
  }

  @Public()
  @Post('refresh')
  /**
   * Refreshes the access token and refresh token.
   * @throws UnauthorizedException if refresh token is not found
   * @returns {Promise<TokenResponseDto>} with the new access token and its expiration time in seconds
   */
  async refresh(
    @Res({ passthrough: true })
    res: Response,
    @Cookie(TOKEN_COOKIE.REFRESH) refreshTokenFromCookie?: string,
  ): Promise<TokenResponseDto> {
    if (!refreshTokenFromCookie) {
      throw new UnauthorizedException(
        ERROR_MESSAGES.AUTH.REFRESH_TOKEN_NOT_FOUND,
      );
    }

    const { accessToken, refreshToken } = await this.authService.refreshTokens({
      refreshToken: refreshTokenFromCookie,
    });

    res.cookie(TOKEN_COOKIE.REFRESH, refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: COOKIE_SAME_SITE.strict,
      path: ROUTES.ROOT,
      maxAge: TOKEN_MAX_AGE.REFRESH,
    });

    return { accessToken, expiresIn: TOKEN_MAX_AGE.ACCESS };
  }

  @Public()
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
  ) {
    await this.authService.logout({
      refreshToken: refreshTokenFromCookie,
    });

    res.clearCookie(TOKEN_COOKIE.ACCESS, { path: ROUTES.ROOT });
    res.clearCookie(TOKEN_COOKIE.REFRESH, { path: ROUTES.ROOT });
    return { success: true };
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  /**
   * Gets the profile of the current user.
   * @throws NotFoundException if user is not found
   * @returns The profile of the current user
   */
  async getProfile(@CurrentUser() user: JwtAuthPayload) {
    return this.authService.getProfile(user.id);
  }
}
