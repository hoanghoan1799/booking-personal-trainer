// TODO: Need to implement
import { Body, Controller, Param, Patch, Req, UseGuards } from '@nestjs/common';

// Commons
import { UserRole } from '../../common/enums/user/user.enum';
import { Roles } from '../../common/decorators/role.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

// Entities
import { User } from './entities/user.entity';

// DTOs
import { UpdateUserRoleDto } from './dtos/update-user.dto';

// Services
import { UserService } from './user.service';

// Guards
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

export interface RequestWithUser extends Request {
  user: User;
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Patch(':userId/role')
  async updateUserRole(
    @Param('userId') id: string,
    @Body() data: UpdateUserRoleDto,
    @Req() req: RequestWithUser,
  ) {
    return this.userService.updateUserRole(id, data, req.user);
  }
}
