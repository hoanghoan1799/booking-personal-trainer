import { HttpStatus } from '@nestjs/common';
import { getSchemaPath } from '@nestjs/swagger';
import type {
  ApiBodyOptions,
  ApiParamOptions,
  ApiResponseOptions,
} from '@nestjs/swagger';

import {
  API_DESCRIPTIONS,
  API_PARAM_NAMES,
  ERROR_MESSAGES,
  FIELD_DESCRIPTIONS,
  SUCCESS_MESSAGES,
} from '../../../common/constants/message.constant';

import { GetUsersQueryDto } from '../dtos/get-user.dto';
import {
  UpdateUserProfileDto,
  UpdateUserRoleDto,
} from '../dtos/update-user.dto';
import {
  ResponseFullUserDto,
  ResponseUserDto,
} from '../dtos/response-user.dto';
import { UserDtoSwagger } from './user-swagger-dto.constants';

export const UserSwagger = {
  Controller: {
    ApiOperation: {
      GetAll: {
        summary: API_DESCRIPTIONS.USER.GET_ALL_SUMMARY,
        description: API_DESCRIPTIONS.USER.GET_ALL_DESCRIPTION,
      },
      UpdateProfile: {
        summary: API_DESCRIPTIONS.USER.UPDATE_PROFILE_SUMMARY,
        description: API_DESCRIPTIONS.USER.UPDATE_PROFILE_DESCRIPTION,
      },
      RequestTrainerRole: {
        summary: API_DESCRIPTIONS.USER.REQUEST_TRAINER_ROLE_SUMMARY,
        description: API_DESCRIPTIONS.USER.REQUEST_TRAINER_ROLE_DESCRIPTION,
      },
      UpdateRole: {
        summary: API_DESCRIPTIONS.USER.UPDATE_ROLE_SUMMARY,
        description: API_DESCRIPTIONS.USER.UPDATE_ROLE_DESCRIPTION,
      },
    },
    ApiBody: {
      UpdateProfile: { type: UpdateUserProfileDto },
      UpdateRole: { type: UpdateUserRoleDto },
    } satisfies Record<string, ApiBodyOptions>,
    ApiParam: {
      UserId: {
        name: API_PARAM_NAMES.USER_ID,
        description: FIELD_DESCRIPTIONS.USER.ID,
        type: String,
      },
    } satisfies Record<string, ApiParamOptions>,
    ApiResponse: {
      Unauthorized: {
        status: HttpStatus.UNAUTHORIZED,
        description: ERROR_MESSAGES.AUTH.ACCESS_TOKEN_INVALID,
      },
      Forbidden: {
        status: HttpStatus.FORBIDDEN,
        description: ERROR_MESSAGES.AUTH.FORBIDDEN,
      },
      UserNotFound: {
        status: HttpStatus.NOT_FOUND,
        description: ERROR_MESSAGES.USER.NOT_FOUND,
      },
      GetAllOk: {
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
      },
      UpdateProfileOk: {
        status: HttpStatus.OK,
        description: SUCCESS_MESSAGES.USER.PROFILE_UPDATED,
        schema: {
          required: ['data'],
          properties: {
            data: { $ref: getSchemaPath(ResponseFullUserDto) },
          },
        },
      },
      RequestTrainerRoleOk: {
        status: HttpStatus.OK,
        description: SUCCESS_MESSAGES.USER.TRAINER_APPLICATION_SUBMITTED,
        schema: {
          required: ['data'],
          properties: {
            data: { $ref: getSchemaPath(ResponseFullUserDto) },
          },
        },
      },
      RequestTrainerRoleConflict: {
        status: HttpStatus.CONFLICT,
        description:
          'Trainer application already pending, already approved, or account in an invalid state.',
      },
      UpdateRoleOk: {
        status: HttpStatus.OK,
        description: SUCCESS_MESSAGES.USER.ROLE_UPDATED,
        schema: {
          required: ['data'],
          properties: {
            data: { $ref: getSchemaPath(ResponseUserDto) },
          },
        },
      },
    } satisfies Record<string, ApiResponseOptions>,
    ApiExtraModels: {
      User: ResponseUserDto,
      FullUser: ResponseFullUserDto,
      Query: GetUsersQueryDto,
    },
  },
  Dto: {
    ...UserDtoSwagger,
  },
} as const;
