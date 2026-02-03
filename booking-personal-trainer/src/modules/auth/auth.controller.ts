import { Controller, Post, Body } from '@nestjs/common';

// Commons
import { Public } from '../../common/decorators/public.decorator';

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
  async login(@Body() data: LoginDto) {
    return this.authService.login(data);
  }
}
