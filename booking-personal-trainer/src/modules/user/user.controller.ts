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
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Serialize } from '../../common/decorators/serialize.decorator';
import { BaseResponseDto } from '../../common/dtos/base-response.dto';

// Types
import type { JwtAuthPayload } from '../auth/types/jwt-auth.type';

// DTOs
import {
  UpdateUserProfileDto,
  UpdateUserRoleDto,
} from './dtos/update-user.dto';
import { GetUsersQueryDto } from './dtos/get-user.dto';
import { ResponseFullUserDto, ResponseUserDto } from './dtos/response-user.dto';

// Services
import { UserService } from './user.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Roles(UserRole.ADMIN)
  @Get()
  @Serialize(ResponseUserDto)
  async getAll(
    @Query() query: GetUsersQueryDto,
  ): Promise<BaseResponseDto<ResponseUserDto[]>> {
    return this.userService.getAll(query);
  }

  @Roles(UserRole.ADMIN, UserRole.TRAINER, UserRole.TRAINEE)
  @Patch('profile')
  @Serialize(ResponseFullUserDto)
  updateProfile(
    @Body() data: UpdateUserProfileDto,
    @CurrentUser() user: JwtAuthPayload,
  ): Promise<BaseResponseDto<ResponseFullUserDto>> {
    return this.userService.updateProfile(data, user);
  }

  @Roles(UserRole.ADMIN)
  @Patch(':userId/role')
  @Serialize(ResponseUserDto)
  async updateUserRole(
    @Param('userId') id: string,
    @Body() data: UpdateUserRoleDto,
    @CurrentUser() user: JwtAuthPayload,
  ): Promise<BaseResponseDto<ResponseUserDto>> {
    return this.userService.updateUserRole(id, data, user);
  }
}
