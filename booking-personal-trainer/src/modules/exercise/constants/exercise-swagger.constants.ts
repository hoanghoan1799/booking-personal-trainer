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

import { CreateExerciseDto } from '../dto/create-exercise.dto';
import { UpdateExerciseDto } from '../dto/update-exercise.dto';
import { ExerciseResponseDto } from '../dto/exercise-response.dto';

import { ExerciseDtoSwagger } from './exercise-swagger-dto.constants';

export const ExerciseSwagger = {
  Controller: {
    ApiOperation: {
      Create: {
        summary: API_DESCRIPTIONS.EXERCISE.CREATE_SUMMARY,
        description: API_DESCRIPTIONS.EXERCISE.CREATE_DESCRIPTION,
      },
      GetAll: {
        summary: API_DESCRIPTIONS.EXERCISE.GET_ALL_SUMMARY,
        description: API_DESCRIPTIONS.EXERCISE.GET_ALL_DESCRIPTION,
      },
      GetOne: {
        summary: API_DESCRIPTIONS.EXERCISE.GET_ONE_SUMMARY,
        description: API_DESCRIPTIONS.EXERCISE.GET_ONE_DESCRIPTION,
      },
      Update: {
        summary: API_DESCRIPTIONS.EXERCISE.UPDATE_SUMMARY,
        description: API_DESCRIPTIONS.EXERCISE.UPDATE_DESCRIPTION,
      },
      Restore: {
        summary: API_DESCRIPTIONS.EXERCISE.RESTORE_SUMMARY,
        description: API_DESCRIPTIONS.EXERCISE.RESTORE_DESCRIPTION,
      },
      Delete: {
        summary: API_DESCRIPTIONS.EXERCISE.DELETE_SUMMARY,
        description: API_DESCRIPTIONS.EXERCISE.DELETE_DESCRIPTION,
      },
    },
    ApiBody: {
      Create: { type: CreateExerciseDto },
      Update: { type: UpdateExerciseDto },
    } satisfies Record<string, ApiBodyOptions>,
    ApiParam: {
      Id: {
        name: API_PARAM_NAMES.ID,
        description: FIELD_DESCRIPTIONS.EXERCISE.ID,
        type: String,
      },
    } satisfies Record<string, ApiParamOptions>,
    ApiResponse: {
      CreateCreated: {
        status: HttpStatus.CREATED,
        description: SUCCESS_MESSAGES.EXERCISE.CREATED,
        schema: {
          required: ['data'],
          properties: {
            data: { $ref: getSchemaPath(ExerciseResponseDto) },
          },
        },
      },
      GetAllOk: {
        status: HttpStatus.OK,
        description: SUCCESS_MESSAGES.EXERCISE.LIST_RETRIEVED,
        schema: {
          required: ['data', 'meta'],
          properties: {
            data: {
              type: 'array',
              items: { $ref: getSchemaPath(ExerciseResponseDto) },
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
      GetOneOk: {
        status: HttpStatus.OK,
        description: SUCCESS_MESSAGES.EXERCISE.RETRIEVED,
        schema: {
          required: ['data'],
          properties: {
            data: { $ref: getSchemaPath(ExerciseResponseDto) },
          },
        },
      },
      UpdateOk: {
        status: HttpStatus.OK,
        description: SUCCESS_MESSAGES.EXERCISE.UPDATED,
        schema: {
          required: ['data'],
          properties: {
            data: { $ref: getSchemaPath(ExerciseResponseDto) },
          },
        },
      },
      RestoreOk: {
        status: HttpStatus.OK,
        description: SUCCESS_MESSAGES.EXERCISE.RESTORED,
        schema: {
          properties: {
            message: { type: 'string' },
          },
        },
      },
      DeleteOk: {
        status: HttpStatus.OK,
        description: SUCCESS_MESSAGES.EXERCISE.DELETED,
        schema: {
          properties: {
            message: { type: 'string' },
          },
        },
      },
      Unauthorized: {
        status: HttpStatus.UNAUTHORIZED,
        description: ERROR_MESSAGES.AUTH.ACCESS_TOKEN_INVALID,
      },
      Forbidden: {
        status: HttpStatus.FORBIDDEN,
        description: ERROR_MESSAGES.AUTH.FORBIDDEN,
      },
      BadRequest: {
        status: HttpStatus.BAD_REQUEST,
        description: ERROR_MESSAGES.AUTH.MISSING_REQUIRED_FIELDS,
      },
      NotFound: {
        status: HttpStatus.NOT_FOUND,
        description: ERROR_MESSAGES.EXERCISE.NOT_FOUND,
      },
    } satisfies Record<string, ApiResponseOptions>,
    ApiExtraModels: {
      ExerciseResponse: ExerciseResponseDto,
    },
  },
  Dto: { ...ExerciseDtoSwagger },
} as const;
