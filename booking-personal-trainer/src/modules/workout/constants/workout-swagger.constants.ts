import { HttpStatus } from '@nestjs/common';
import { getSchemaPath } from '@nestjs/swagger';

import {
  API_DESCRIPTIONS,
  API_PARAM_NAMES,
  ERROR_MESSAGES,
  FIELD_DESCRIPTIONS,
  SUCCESS_MESSAGES,
} from '../../../common/constants/message.constant';
import { CreateWorkoutDto } from '../dtos/create-workout.dto';
import { CreateBookingWorkoutDto } from '../dtos/create-booking-workout.dto';
import { UpdateWorkoutDetailDto } from '../dtos/update-workout-detail.dto';
import { WorkoutResponseDto } from '../dtos/workout-response.dto';
import { WorkoutDtoSwagger } from './workout-swagger-dto.constants';
export const WorkoutSwagger = {
  Controller: {
    Workout: {
      ApiOperation: {
        Create: {
          summary: API_DESCRIPTIONS.WORKOUT.CREATE_SUMMARY,
          description: API_DESCRIPTIONS.WORKOUT.CREATE_DESCRIPTION,
        },
        GetAll: {
          summary: API_DESCRIPTIONS.WORKOUT.GET_ALL_SUMMARY,
          description: API_DESCRIPTIONS.WORKOUT.GET_ALL_DESCRIPTION,
        },
        GetOne: {
          summary: API_DESCRIPTIONS.WORKOUT.GET_ONE_SUMMARY,
          description: API_DESCRIPTIONS.WORKOUT.GET_ONE_DESCRIPTION,
        },
        Update: {
          summary: API_DESCRIPTIONS.WORKOUT.UPDATE_DETAIL_SUMMARY,
          description: API_DESCRIPTIONS.WORKOUT.UPDATE_DETAIL_DESCRIPTION,
        },
        Delete: {
          summary: API_DESCRIPTIONS.WORKOUT.DELETE_SUMMARY,
          description: API_DESCRIPTIONS.WORKOUT.DELETE_DESCRIPTION,
        },
      },
      ApiBody: {
        Create: { type: CreateWorkoutDto },
        Update: { type: UpdateWorkoutDetailDto },
      },
      ApiParam: {
        Id: {
          name: API_PARAM_NAMES.ID,
          description: FIELD_DESCRIPTIONS.WORKOUT.ID,
          type: String,
        },
      },
      ApiResponse: {
        CreateCreated: {
          status: HttpStatus.CREATED,
          description: SUCCESS_MESSAGES.WORKOUT.CREATED,
          schema: {
            required: ['data'],
            properties: {
              data: { $ref: getSchemaPath(WorkoutResponseDto) },
            },
          },
        },
        GetAllOk: {
          status: HttpStatus.OK,
          description: SUCCESS_MESSAGES.WORKOUT.LIST_RETRIEVED,
          schema: {
            required: ['data', 'meta'],
            properties: {
              data: {
                type: 'array',
                items: { $ref: getSchemaPath(WorkoutResponseDto) },
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
          description: SUCCESS_MESSAGES.WORKOUT.RETRIEVED,
          schema: {
            required: ['data'],
            properties: {
              data: { $ref: getSchemaPath(WorkoutResponseDto) },
            },
          },
        },
        UpdateOk: {
          status: HttpStatus.OK,
          description: SUCCESS_MESSAGES.WORKOUT.DETAIL_UPDATED,
          schema: {
            required: ['data'],
            properties: {
              data: { $ref: getSchemaPath(WorkoutResponseDto) },
            },
          },
        },
        DeleteOk: {
          status: HttpStatus.OK,
          description: SUCCESS_MESSAGES.WORKOUT.DELETED,
          schema: { properties: { message: { type: 'string' } } },
        },
        Unauthorized: {
          status: HttpStatus.UNAUTHORIZED,
          description: ERROR_MESSAGES.AUTH.ACCESS_TOKEN_INVALID,
        },
        Forbidden: {
          status: HttpStatus.FORBIDDEN,
          description: ERROR_MESSAGES.AUTH.FORBIDDEN,
        },
        CreateBadRequest: {
          status: HttpStatus.BAD_REQUEST,
          description: `${ERROR_MESSAGES.WORKOUT.INVALID_TIME_RANGE} or ${ERROR_MESSAGES.WORKOUT.INVALID_EXERCISES}`,
        },
        CreateNotFound: {
          status: HttpStatus.NOT_FOUND,
          description: ERROR_MESSAGES.USER.NOT_FOUND,
        },
        GetOneNotFound: {
          status: HttpStatus.NOT_FOUND,
          description: ERROR_MESSAGES.WORKOUT.NOT_FOUND,
        },
        UpdateBadRequest: {
          status: HttpStatus.BAD_REQUEST,
          description: ERROR_MESSAGES.WORKOUT.CANNOT_UPDATE_EXERCISES,
        },
        UpdateNotFound: {
          status: HttpStatus.NOT_FOUND,
          description: ERROR_MESSAGES.WORKOUT.NOT_FOUND,
        },
      },
    },
    BookingWorkout: {
      ApiOperation: {
        Create: { summary: 'Create a workout for a booking from a template' },
      },
      ApiParam: {
        BookingId: { name: 'bookingId', type: String },
      },
      ApiBody: {
        Create: { type: CreateBookingWorkoutDto },
      },
      ApiResponse: {
        CreateCreated: {
          status: HttpStatus.CREATED,
          schema: {
            required: ['data'],
            properties: {
              data: { $ref: getSchemaPath(WorkoutResponseDto) },
            },
          },
        },
      },
    },
  },
  Dto: { ...WorkoutDtoSwagger },
} as const;
