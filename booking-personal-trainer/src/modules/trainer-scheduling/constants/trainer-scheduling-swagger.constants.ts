import { HttpStatus } from '@nestjs/common';
import { getSchemaPath } from '@nestjs/swagger';
import type { ApiResponseOptions } from '@nestjs/swagger';

import {
  API_DESCRIPTIONS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
} from '../../../common/constants/message.constant';

import { CreateTrainerAvailabilityDto } from '../dtos/create-trainer-availability.dto';
import { UpdateTrainerAvailabilityDto } from '../dtos/update-trainer-availability.dto';
import { TrainerAvailabilityResponseDto } from '../dtos/trainer-availability-response.dto';
import { UpdateTrainerAvailabilityResponseDto } from '../dtos/update-trainer-availability-response.dto';
import { CreateTrainerTimeOffDto } from '../dtos/create-trainer-time-off.dto';
import { UpdateTrainerTimeOffDto } from '../dtos/update-trainer-time-off.dto';
import { TrainerTimeOffResponseDto } from '../dtos/trainer-time-off-response.dto';
import { TrainerSchedulingDtoSwagger } from './trainer-scheduling-swagger-dto.constants';

export const TrainerSchedulingSwagger = {
  Controller: {
    ApiOperation: {
      GetMyAvailabilities: {
        summary:
          API_DESCRIPTIONS.TRAINER_SCHEDULING.GET_MY_AVAILABILITIES_SUMMARY,
        description:
          API_DESCRIPTIONS.TRAINER_SCHEDULING.GET_MY_AVAILABILITIES_DESCRIPTION,
      },
      CreateMyAvailability: {
        summary:
          API_DESCRIPTIONS.TRAINER_SCHEDULING.CREATE_MY_AVAILABILITY_SUMMARY,
        description:
          API_DESCRIPTIONS.TRAINER_SCHEDULING
            .CREATE_MY_AVAILABILITY_DESCRIPTION,
      },
      UpdateMyAvailability: {
        summary:
          API_DESCRIPTIONS.TRAINER_SCHEDULING.UPDATE_MY_AVAILABILITY_SUMMARY,
        description:
          API_DESCRIPTIONS.TRAINER_SCHEDULING
            .UPDATE_MY_AVAILABILITY_DESCRIPTION,
      },
      DeleteMyAvailability: {
        summary:
          API_DESCRIPTIONS.TRAINER_SCHEDULING.DELETE_MY_AVAILABILITY_SUMMARY,
        description:
          API_DESCRIPTIONS.TRAINER_SCHEDULING
            .DELETE_MY_AVAILABILITY_DESCRIPTION,
      },
      GetMyTimeOff: {
        summary: API_DESCRIPTIONS.TRAINER_SCHEDULING.GET_MY_TIME_OFF_SUMMARY,
        description:
          API_DESCRIPTIONS.TRAINER_SCHEDULING.GET_MY_TIME_OFF_DESCRIPTION,
      },
      CreateMyTimeOff: {
        summary: API_DESCRIPTIONS.TRAINER_SCHEDULING.CREATE_MY_TIME_OFF_SUMMARY,
        description:
          API_DESCRIPTIONS.TRAINER_SCHEDULING.CREATE_MY_TIME_OFF_DESCRIPTION,
      },
      UpdateMyTimeOff: {
        summary: API_DESCRIPTIONS.TRAINER_SCHEDULING.UPDATE_MY_TIME_OFF_SUMMARY,
        description:
          API_DESCRIPTIONS.TRAINER_SCHEDULING.UPDATE_MY_TIME_OFF_DESCRIPTION,
      },
      DeleteMyTimeOff: {
        summary: API_DESCRIPTIONS.TRAINER_SCHEDULING.DELETE_MY_TIME_OFF_SUMMARY,
        description:
          API_DESCRIPTIONS.TRAINER_SCHEDULING.DELETE_MY_TIME_OFF_DESCRIPTION,
      },
    },
    ApiBody: {
      CreateMyAvailability: { type: CreateTrainerAvailabilityDto },
      UpdateMyAvailability: { type: UpdateTrainerAvailabilityDto },
      CreateMyTimeOff: { type: CreateTrainerTimeOffDto },
      UpdateMyTimeOff: { type: UpdateTrainerTimeOffDto },
    },
    ApiParam: {
      AvailabilityId: { name: 'availabilityId', type: String },
      TimeOffId: { name: 'timeOffId', type: String },
    },
    ApiResponse: {
      Unauthorized: {
        status: HttpStatus.UNAUTHORIZED,
        description: ERROR_MESSAGES.AUTH.ACCESS_TOKEN_INVALID,
      },
      GetMyAvailabilitiesOk: {
        status: HttpStatus.OK,
        description:
          SUCCESS_MESSAGES.TRAINER_SCHEDULING.AVAILABILITY_LIST_RETRIEVED,
        schema: {
          required: ['data', 'meta'],
          properties: {
            data: {
              type: 'array',
              items: { $ref: getSchemaPath(TrainerAvailabilityResponseDto) },
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
      CreateMyAvailabilityOk: {
        status: HttpStatus.OK,
        description: SUCCESS_MESSAGES.TRAINER_SCHEDULING.AVAILABILITY_CREATED,
        schema: {
          required: ['data'],
          properties: {
            data: { $ref: getSchemaPath(TrainerAvailabilityResponseDto) },
          },
        },
      },
      UpdateMyAvailabilityOk: {
        status: HttpStatus.OK,
        description: SUCCESS_MESSAGES.TRAINER_SCHEDULING.AVAILABILITY_UPDATED,
        schema: {
          required: ['data'],
          properties: {
            data: {
              $ref: getSchemaPath(UpdateTrainerAvailabilityResponseDto),
            },
          },
        },
      },
      DeleteMyAvailabilityOk: {
        status: HttpStatus.OK,
        description: SUCCESS_MESSAGES.TRAINER_SCHEDULING.AVAILABILITY_DELETED,
      },
      GetMyTimeOffOk: {
        status: HttpStatus.OK,
        description:
          SUCCESS_MESSAGES.TRAINER_SCHEDULING.TIME_OFF_LIST_RETRIEVED,
        schema: {
          required: ['data', 'meta'],
          properties: {
            data: {
              type: 'array',
              items: { $ref: getSchemaPath(TrainerTimeOffResponseDto) },
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
      CreateMyTimeOffOk: {
        status: HttpStatus.OK,
        description: SUCCESS_MESSAGES.TRAINER_SCHEDULING.TIME_OFF_CREATED,
        schema: {
          required: ['data'],
          properties: {
            data: { $ref: getSchemaPath(TrainerTimeOffResponseDto) },
          },
        },
      },
      UpdateMyTimeOffOk: {
        status: HttpStatus.OK,
        description: SUCCESS_MESSAGES.TRAINER_SCHEDULING.TIME_OFF_UPDATED,
        schema: {
          required: ['data'],
          properties: {
            data: { $ref: getSchemaPath(TrainerTimeOffResponseDto) },
          },
        },
      },
      DeleteMyTimeOffOk: {
        status: HttpStatus.OK,
        description: SUCCESS_MESSAGES.TRAINER_SCHEDULING.TIME_OFF_DELETED,
      },
    } satisfies Record<string, ApiResponseOptions>,
    ApiExtraModels: {
      Availability: TrainerAvailabilityResponseDto,
      AvailabilityUpdate: UpdateTrainerAvailabilityResponseDto,
      TimeOff: TrainerTimeOffResponseDto,
    },
  },
  Dto: {
    ...TrainerSchedulingDtoSwagger,
  },
} as const;
