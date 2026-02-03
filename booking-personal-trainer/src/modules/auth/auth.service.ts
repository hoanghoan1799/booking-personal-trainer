import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

// Commons
import { ERROR_MESSAGES } from '../../common/constants/message.constant';

// Types
import { JwtAuthPayload } from './types/jwt-auth.type';

// DTOs
import { RegisterDto } from './dtos/register.dto';
import { ResponseUserDto } from '../user/dtos/response-user.dto';
import { LoginDto } from './dtos/login.dto';

// Services
import { UserService } from '../user/user.service';
import { HashingService } from './services/hashing.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly hashingService: HashingService,
  ) {}

  async register(data: RegisterDto) {
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

  async login(data: LoginDto) {
    const { email, password } = data;

    const existingUser = await this.userService.findByEmailOrUserName(email);

    if (!existingUser) {
      throw new NotFoundException(ERROR_MESSAGES.USER.NOT_FOUND);
    }

    const isPasswordValid = await this.hashingService.compare(
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
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return { accessToken };
  }
}
