import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Patch,
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
  getSchemaPath,
} from '@nestjs/swagger';

// Commons
import { UserRole } from '../../common/enums/user/user.enum';
import { Roles } from '../../common/decorators/role.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Serialize } from '../../common/decorators/serialize.decorator';
import { BaseResponseDto } from '../../common/dtos/base-response.dto';
import {
  API_DESCRIPTIONS,
  API_PARAM_NAMES,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  FIELD_DESCRIPTIONS,
} from '../../common/constants/message.constant';
import { SWAGGER_ACCESS_TOKEN } from '../../common/constants/api-document.constants';

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

// Rate limiting
import {
  createRateLimitByIdentityResolver,
  RATE_LIMIT_WINDOW_TTL_MILLISECONDS,
} from '../../common/helpers/rate-limit-override.helper';

@ApiTags('User')
@ApiBearerAuth(SWAGGER_ACCESS_TOKEN)
@ApiExtraModels(ResponseUserDto, ResponseFullUserDto)
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Roles(UserRole.ADMIN, UserRole.TRAINER, UserRole.TRAINEE)
  @Get()
  @Serialize(ResponseUserDto)
  @ApiOperation({
    summary: API_DESCRIPTIONS.USER.GET_ALL_SUMMARY,
    description: API_DESCRIPTIONS.USER.GET_ALL_DESCRIPTION,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: SUCCESS_MESSAGES.USER.LIST_RETRIEVED,
    schema: {
      required: ['data', 'meta'],
      properties: {
        data: {
          type: 'array',
          items: { $ref: getSchemaPath(ResponseUserDto) },
        },
        meta: {
          type: 'object',
          properties: {
            page: { type: 'number' },
            limit: { type: 'number' },
            totalItems: { type: 'number' },
            totalPages: { type: 'number' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: ERROR_MESSAGES.AUTH.ACCESS_TOKEN_INVALID,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: ERROR_MESSAGES.AUTH.FORBIDDEN,
  })
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
  @ApiOperation({
    summary: API_DESCRIPTIONS.USER.UPDATE_PROFILE_SUMMARY,
    description: API_DESCRIPTIONS.USER.UPDATE_PROFILE_DESCRIPTION,
  })
  @ApiBody({ type: UpdateUserProfileDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: SUCCESS_MESSAGES.USER.PROFILE_UPDATED,
    schema: {
      required: ['data'],
      properties: {
        data: { $ref: getSchemaPath(ResponseFullUserDto) },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: ERROR_MESSAGES.AUTH.ACCESS_TOKEN_INVALID,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: ERROR_MESSAGES.USER.NOT_FOUND,
  })
  updateProfile(
    @Body() data: UpdateUserProfileDto,
    @CurrentUser() user: JwtAuthPayload,
  ): Promise<BaseResponseDto<ResponseFullUserDto>> {
    return this.userService.updateProfile(data, user);
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
  @ApiOperation({
    summary: API_DESCRIPTIONS.USER.UPDATE_ROLE_SUMMARY,
    description: API_DESCRIPTIONS.USER.UPDATE_ROLE_DESCRIPTION,
  })
  @ApiParam({
    name: API_PARAM_NAMES.USER_ID,
    description: FIELD_DESCRIPTIONS.USER.ID,
    type: String,
  })
  @ApiBody({ type: UpdateUserRoleDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: SUCCESS_MESSAGES.USER.ROLE_UPDATED,
    schema: {
      required: ['data'],
      properties: {
        data: { $ref: getSchemaPath(ResponseUserDto) },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: ERROR_MESSAGES.AUTH.ACCESS_TOKEN_INVALID,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: ERROR_MESSAGES.AUTH.FORBIDDEN,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: ERROR_MESSAGES.USER.NOT_FOUND,
  })
  async updateUserRole(
    @Param('userId') id: string,
    @Body() data: UpdateUserRoleDto,
    @CurrentUser() user: JwtAuthPayload,
  ): Promise<BaseResponseDto<ResponseUserDto>> {
    return this.userService.updateUserRole(id, data, user);
  }
}
