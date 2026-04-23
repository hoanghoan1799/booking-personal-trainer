import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiExtraModels,
  ApiParam,
} from '@nestjs/swagger';

// Commons
import { UserRole } from '../../../common/enums/user/user.enum';
import { Roles } from '../../../common/decorators/role.decorator';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { CurrentUser } from '../../../common/decorators/user.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { Serialize } from '../../../common/decorators/serialize.decorator';
import { BaseResponseDto } from '../../../common/dtos/base-response.dto';
import { SWAGGER_ACCESS_TOKEN } from '../../../common/constants/api-document.constants';

// Types
import type { JwtAuthPayload } from '../../auth/types/jwt-auth.type';

// DTOs
import {
  UpdateUserProfileDto,
  UpdateUserRoleDto,
} from '../dtos/update-user.dto';
import { GetUsersQueryDto } from '../dtos/get-user.dto';
import {
  ResponseFullUserDto,
  ResponseUserDto,
} from '../dtos/response-user.dto';

// Services
import { UserService } from '../services/user.service';
import { UserSwagger } from '../constants/user-swagger.constants';

// Rate limiting
import {
  createRateLimitByIdentityResolver,
  RATE_LIMIT_WINDOW_TTL_MILLISECONDS,
} from '../../../common/helpers/rate-limit-override.helper';

@ApiTags('User')
@ApiBearerAuth(SWAGGER_ACCESS_TOKEN)
@ApiExtraModels(
  UserSwagger.Controller.ApiExtraModels.User,
  UserSwagger.Controller.ApiExtraModels.FullUser,
)
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Roles(UserRole.ADMIN, UserRole.TRAINER, UserRole.TRAINEE)
  @Get()
  @Serialize(ResponseUserDto)
  @ApiOperation(UserSwagger.Controller.ApiOperation.GetAll)
  @ApiResponse(UserSwagger.Controller.ApiResponse.GetAllOk)
  @ApiResponse(UserSwagger.Controller.ApiResponse.Unauthorized)
  @ApiResponse(UserSwagger.Controller.ApiResponse.Forbidden)
  async getAll(
    @Query() query: GetUsersQueryDto,
    @CurrentUser() currentUser: JwtAuthPayload,
  ): Promise<BaseResponseDto<ResponseUserDto[]>> {
    return this.userService.getAll(query, currentUser);
  }

  @Roles(UserRole.ADMIN, UserRole.TRAINER, UserRole.TRAINEE)
  @Patch('profile')
  /**
   * Rate-limit override (stricter than global baseline).
   *
   * Why:
   * - Profile updates are write operations and can be abused (spam edits) or accidentally looped by clients.
   * - Tight limits reduce write pressure and prevent noisy clients from degrading performance.
   */
  @Throttle({
    burst: {
      ttl: RATE_LIMIT_WINDOW_TTL_MILLISECONDS.BURST,
      limit: createRateLimitByIdentityResolver({ ip: 10, token: 15, user: 20 }),
    },
    minute: {
      ttl: RATE_LIMIT_WINDOW_TTL_MILLISECONDS.MINUTE,
      limit: createRateLimitByIdentityResolver({
        ip: 80,
        token: 120,
        user: 180,
      }),
    },
    hour: {
      ttl: RATE_LIMIT_WINDOW_TTL_MILLISECONDS.HOUR,
      limit: createRateLimitByIdentityResolver({
        ip: 800,
        token: 1200,
        user: 1800,
      }),
    },
  })
  @Serialize(ResponseFullUserDto)
  @ApiOperation(UserSwagger.Controller.ApiOperation.UpdateProfile)
  @ApiBody(UserSwagger.Controller.ApiBody.UpdateProfile)
  @ApiResponse(UserSwagger.Controller.ApiResponse.UpdateProfileOk)
  @ApiResponse(UserSwagger.Controller.ApiResponse.Unauthorized)
  @ApiResponse(UserSwagger.Controller.ApiResponse.UserNotFound)
  updateProfile(
    @Body() data: UpdateUserProfileDto,
    @CurrentUser() user: JwtAuthPayload,
  ): Promise<BaseResponseDto<ResponseFullUserDto>> {
    return this.userService.updateProfile(data, user);
  }

  @Roles(UserRole.TRAINEE)
  @Post('profile/trainer-request')
  /**
   * Rate-limit override (same spirit as profile PATCH).
   */
  @Throttle({
    burst: {
      ttl: RATE_LIMIT_WINDOW_TTL_MILLISECONDS.BURST,
      limit: createRateLimitByIdentityResolver({ ip: 10, token: 15, user: 20 }),
    },
    minute: {
      ttl: RATE_LIMIT_WINDOW_TTL_MILLISECONDS.MINUTE,
      limit: createRateLimitByIdentityResolver({
        ip: 80,
        token: 120,
        user: 180,
      }),
    },
    hour: {
      ttl: RATE_LIMIT_WINDOW_TTL_MILLISECONDS.HOUR,
      limit: createRateLimitByIdentityResolver({
        ip: 800,
        token: 1200,
        user: 1800,
      }),
    },
  })
  @Serialize(ResponseFullUserDto)
  @ApiOperation(UserSwagger.Controller.ApiOperation.RequestTrainerRole)
  @ApiResponse(UserSwagger.Controller.ApiResponse.RequestTrainerRoleOk)
  @ApiResponse(UserSwagger.Controller.ApiResponse.Unauthorized)
  @ApiResponse(UserSwagger.Controller.ApiResponse.Forbidden)
  @ApiResponse(UserSwagger.Controller.ApiResponse.RequestTrainerRoleConflict)
  @ApiResponse(UserSwagger.Controller.ApiResponse.UserNotFound)
  requestTrainerRole(
    @CurrentUser() user: JwtAuthPayload,
  ): Promise<BaseResponseDto<ResponseFullUserDto>> {
    return this.userService.requestTrainerRole(user);
  }

  @Roles(UserRole.ADMIN)
  @Patch(':userId/role')
  /**
   * Rate-limit override (strict).
   *
   * Why:
   * - Role changes are privilege-impacting operations (security sensitive).
   * - Stricter limits reduce the impact of automation or misuse by administrators.
   */
  @Throttle({
    burst: {
      ttl: RATE_LIMIT_WINDOW_TTL_MILLISECONDS.BURST,
      limit: createRateLimitByIdentityResolver({ ip: 5, token: 8, user: 10 }),
    },
    minute: {
      ttl: RATE_LIMIT_WINDOW_TTL_MILLISECONDS.MINUTE,
      limit: createRateLimitByIdentityResolver({ ip: 30, token: 45, user: 60 }),
    },
    hour: {
      ttl: RATE_LIMIT_WINDOW_TTL_MILLISECONDS.HOUR,
      limit: createRateLimitByIdentityResolver({
        ip: 200,
        token: 300,
        user: 500,
      }),
    },
  })
  @Serialize(ResponseUserDto)
  @ApiOperation(UserSwagger.Controller.ApiOperation.UpdateRole)
  @ApiParam(UserSwagger.Controller.ApiParam.UserId)
  @ApiBody(UserSwagger.Controller.ApiBody.UpdateRole)
  @ApiResponse(UserSwagger.Controller.ApiResponse.UpdateRoleOk)
  @ApiResponse(UserSwagger.Controller.ApiResponse.Unauthorized)
  @ApiResponse(UserSwagger.Controller.ApiResponse.Forbidden)
  @ApiResponse(UserSwagger.Controller.ApiResponse.UserNotFound)
  async updateUserRole(
    @Param('userId') id: string,
    @Body() data: UpdateUserRoleDto,
    @CurrentUser() user: JwtAuthPayload,
  ): Promise<BaseResponseDto<ResponseUserDto>> {
    return this.userService.updateUserRole(id, data, user);
  }
}
