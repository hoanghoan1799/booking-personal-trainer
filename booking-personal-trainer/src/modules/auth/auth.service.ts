import { ConflictException, Injectable } from '@nestjs/common';

// Commons
import { ERROR_MESSAGES } from '../../common/constants/message.constant';

// DTOs
import { RegisterDto } from './dtos/register.dto';
import { ResponseUserDto } from '../user/dtos/response-user.dto';

// Services
import { UserService } from '../user/user.service';
import { HashingService } from './services/hashing.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
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
}
