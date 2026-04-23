import { HttpStatus } from '@nestjs/common';
import { getSchemaPath } from '@nestjs/swagger';

import {
  API_DESCRIPTIONS,
  API_PARAM_NAMES,
  ERROR_MESSAGES,
  FIELD_DESCRIPTIONS,
  SUCCESS_MESSAGES,
} from '../../../common/constants/message.constant';

import { CreateBookingDto } from '../dtos/create-booking.dto';
import { CreateBookingsBulkDto } from '../dtos/create-bookings-bulk.dto';
import { GetAvailableTrainersForPeriodQueryDto } from '../dtos/get-available-trainers-for-period.dto';
import { GetAvailableSlotsQueryDto } from '../dtos/get-available-slots.dto';
import { GetAvailableTrainersQueryDto } from '../dtos/get-available-trainers.dto';
import { UpdateBookingStatusDto } from '../dtos/update-booking-status.dto';
import { BookingResponseDto } from '../dtos/response-booking.dto';
import { ResponseUserDto } from '../../user/dtos/response-user.dto';
import { BookingDtoSwagger } from './booking-swagger-dto.constants';

export const BookingSwagger = {
  Controller: {
    ApiOperation: {
      CreateBulk: {
        summary: 'Bulk create bookings in a transaction',
        description:
          'Creates multiple bookings (day/week/month/year) atomically. If any occurrence fails, none are created.',
      },
      Create: {
        summary: API_DESCRIPTIONS.BOOKING.CREATE_SUMMARY,
        description: API_DESCRIPTIONS.BOOKING.CREATE_DESCRIPTION,
      },
      GetAll: {
        summary: API_DESCRIPTIONS.BOOKING.GET_ALL_SUMMARY,
        description: API_DESCRIPTIONS.BOOKING.GET_ALL_DESCRIPTION,
      },
      GetOne: {
        summary: API_DESCRIPTIONS.BOOKING.GET_ONE_SUMMARY,
        description: API_DESCRIPTIONS.BOOKING.GET_ONE_DESCRIPTION,
      },
      UpdateStatus: {
        summary: API_DESCRIPTIONS.BOOKING.UPDATE_STATUS_SUMMARY,
        description: API_DESCRIPTIONS.BOOKING.UPDATE_STATUS_DESCRIPTION,
      },
      AvailableTrainers: {
        summary: 'List available trainers for a time range',
      },
      AvailableSlots: {
        summary: 'List available slots for a trainer in a range',
      },
      AvailableTrainersForPeriod: {
        summary: 'List available trainers for a period (week/month/year)',
      },
    },
    ApiBody: {
      CreateBulk: { type: CreateBookingsBulkDto },
      Create: { type: CreateBookingDto },
      UpdateStatus: { type: UpdateBookingStatusDto },
    },
    ApiParam: {
      Id: {
        name: API_PARAM_NAMES.ID,
        description: FIELD_DESCRIPTIONS.BOOKING.ID,
        type: String,
      },
    },
    ApiResponse: {
      CreateCreated: {
        status: HttpStatus.CREATED,
        description: SUCCESS_MESSAGES.BOOKING.CREATED,
        schema: {
          required: ['data'],
          properties: {
            data: { $ref: getSchemaPath(BookingResponseDto) },
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
      CreateBadRequest: {
        status: HttpStatus.BAD_REQUEST,
        description: `${ERROR_MESSAGES.BOOKING.INVALID_TIME_RANGE} or ${ERROR_MESSAGES.BOOKING.CANNOT_BOOK_IN_PAST} or ${ERROR_MESSAGES.BOOKING.MUST_BOOK_BEFORE_30_MINUTES} or ${ERROR_MESSAGES.BOOKING.CANNOT_BOOK_SELF} or ${ERROR_MESSAGES.BOOKING.TIME_SLOT_NOT_AVAILABLE}`,
      },
      CreateNotFound: {
        status: HttpStatus.NOT_FOUND,
        description: ERROR_MESSAGES.USER.TRAINER_NOT_AVAILABLE,
      },
      GetAllOk: {
        status: HttpStatus.OK,
        description: SUCCESS_MESSAGES.BOOKING.LIST_RETRIEVED,
        schema: {
          required: ['data', 'meta'],
          properties: {
            data: {
              type: 'array',
              items: { $ref: getSchemaPath(BookingResponseDto) },
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
        description: SUCCESS_MESSAGES.BOOKING.RETRIEVED,
        schema: {
          required: ['data'],
          properties: {
            data: { $ref: getSchemaPath(BookingResponseDto) },
          },
        },
      },
      GetOneNotFound: {
        status: HttpStatus.NOT_FOUND,
        description: ERROR_MESSAGES.BOOKING.NOT_FOUND,
      },
      UpdateStatusOk: {
        status: HttpStatus.OK,
        description: SUCCESS_MESSAGES.BOOKING.STATUS_UPDATED,
        schema: {
          required: ['data'],
          properties: {
            data: { $ref: getSchemaPath(BookingResponseDto) },
          },
        },
      },
      UpdateStatusBadRequest: {
        status: HttpStatus.BAD_REQUEST,
        description: ERROR_MESSAGES.BOOKING.CANNOT_UPDATE_STATUS,
      },
      UpdateStatusNotFound: {
        status: HttpStatus.NOT_FOUND,
        description: ERROR_MESSAGES.BOOKING.NOT_FOUND,
      },
    },
    ApiExtraModels: {
      Booking: BookingResponseDto,
      User: ResponseUserDto,
    },
    QueryDto: {
      AvailableTrainers: GetAvailableTrainersQueryDto,
      AvailableSlots: GetAvailableSlotsQueryDto,
      AvailableTrainersForPeriod: GetAvailableTrainersForPeriodQueryDto,
    },
  },
  Dto: {
    ...BookingDtoSwagger,
  },
} as const;
