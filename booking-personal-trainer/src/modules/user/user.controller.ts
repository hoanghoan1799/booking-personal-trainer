// TODO: Need to implement
import { Controller } from '@nestjs/common';

// DTOs

// Services
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}
}
