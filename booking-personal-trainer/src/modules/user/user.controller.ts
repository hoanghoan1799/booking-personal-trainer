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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiExtraModels,
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
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
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
  @Serialize(ResponseUserDto)
  @ApiOperation({
    summary: API_DESCRIPTIONS.USER.UPDATE_ROLE_SUMMARY,
    description: API_DESCRIPTIONS.USER.UPDATE_ROLE_DESCRIPTION,
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
