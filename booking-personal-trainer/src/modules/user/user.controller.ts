import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';

// Commons
import { UserRole } from '../../common/enums/user/user.enum';
import { Roles } from '../../common/decorators/role.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/user.decorator';

// Types
import type { JwtAuthPayload } from '../auth/types/jwt-auth.type';

// DTOs
import {
  UpdateUserProfileDto,
  UpdateUserRoleDto,
} from './dtos/update-user.dto';
import { GetUsersQueryDto } from './dtos/get-user.dto';

// Services
import { UserService } from './user.service';

// Guards
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Roles(UserRole.ADMIN)
  @Get()
  async getAll(@Query() query: GetUsersQueryDto) {
    return this.userService.getAll(query);
  }

  @Roles(UserRole.ADMIN, UserRole.TRAINER, UserRole.TRAINEE)
  @Patch('profile')
  updateProfile(
    @Body() data: UpdateUserProfileDto,
    @CurrentUser() user: JwtAuthPayload,
  ) {
    return this.userService.updateProfile(data, user);
  }

  @Roles(UserRole.ADMIN)
  @Patch(':userId/role')
  async updateUserRole(
    @Param('userId') id: string,
    @Body() data: UpdateUserRoleDto,
    @CurrentUser() user: JwtAuthPayload,
  ) {
    return this.userService.updateUserRole(id, data, user);
  }
}
