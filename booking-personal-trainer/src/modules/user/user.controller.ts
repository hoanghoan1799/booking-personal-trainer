// TODO: Need to implement
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
import { UpdateUserRoleDto } from './dtos/update-user.dto';
import { GetUsersQueryDto } from './dtos/get-user.dto';

// Services
import { UserService } from './user.service';

// Guards
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async getAll(@Query() query: GetUsersQueryDto) {
    return this.userService.getAll(query);
  }

  @Patch(':userId/role')
  async updateUserRole(
    @Param('userId') id: string,
    @Body() data: UpdateUserRoleDto,
    @CurrentUser() user: JwtAuthPayload,
  ) {
    return this.userService.updateUserRole(id, data, user);
  }
}
