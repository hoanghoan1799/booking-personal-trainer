import { Controller, Post, Body, Res } from '@nestjs/common';
import type { Response } from 'express';

// Commons
import { Public } from '../../common/decorators/public.decorator';
import {
  TOKEN_COOKIE,
  TOKEN_MAX_AGE,
} from '../../common/constants/token.constants';
import { ROUTES } from 'src/common/constants/route.constant';
import { COOKIE_SAME_SITE } from 'src/common/constants/cookie.constant';

// DTOs
import { RegisterDto } from './dtos/register.dto';
import { LoginDto } from './dtos/login.dto';

// Services
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  async create(@Body() data: RegisterDto) {
    return this.authService.register(data);
  }

  @Public()
  @Post('login')
  async login(
    @Body() data: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const userResponse = await this.authService.login(data);

    const { accessToken, user } = userResponse;

    res.cookie(TOKEN_COOKIE.ACCESS, accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: COOKIE_SAME_SITE.strict,
      path: ROUTES.ROOT,
      maxAge: TOKEN_MAX_AGE.ACCESS,
    });

    return user;
  }
}
