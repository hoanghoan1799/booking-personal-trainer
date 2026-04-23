import type { ApiPropertyOptions } from '@nestjs/swagger';

import {
  API_FORMATS,
  FIELD_DESCRIPTIONS,
} from '../../../common/constants/message.constant';
import { BookingStatus } from '../../../common/enums/booking/booking.enum';
import { ResponseUserDto } from '../../user/dtos/response-user.dto';

export const BookingDtoSwagger = {
  CreateBooking: {
    ApiProperty: {
      TrainerId: {
        description: FIELD_DESCRIPTIONS.BOOKING.TRAINER_ID,
        format: API_FORMATS.UUID,
        example: FIELD_DESCRIPTIONS.USER.ID_EXAMPLE,
      } satisfies ApiPropertyOptions,
      StartTime: {
        description: FIELD_DESCRIPTIONS.BOOKING.START_TIME,
        format: API_FORMATS.DATE_TIME,
        example: FIELD_DESCRIPTIONS.COMMON.DATE_TIME_START_EXAMPLE,
      } satisfies ApiPropertyOptions,
      EndTime: {
        description: FIELD_DESCRIPTIONS.BOOKING.END_TIME,
        format: API_FORMATS.DATE_TIME,
        example: FIELD_DESCRIPTIONS.COMMON.DATE_TIME_END_EXAMPLE,
      } satisfies ApiPropertyOptions,
    },
  },
  GetAvailableTrainersQuery: {
    ApiProperty: {
      StartTime: {
        description: FIELD_DESCRIPTIONS.BOOKING.START_TIME,
        format: API_FORMATS.DATE_TIME,
        example: FIELD_DESCRIPTIONS.COMMON.DATE_TIME_START_EXAMPLE,
      } satisfies ApiPropertyOptions,
      EndTime: {
        description: FIELD_DESCRIPTIONS.BOOKING.END_TIME,
        format: API_FORMATS.DATE_TIME,
        example: FIELD_DESCRIPTIONS.COMMON.DATE_TIME_END_EXAMPLE,
      } satisfies ApiPropertyOptions,
    },
  },
  GetAvailableSlotsQuery: {
    ApiPropertyOptional: {
      DurationMinutes: { description: 'Slot duration in minutes (default 60)' },
      StepMinutes: { description: 'Slot step in minutes (default 30)' },
    } satisfies Record<string, ApiPropertyOptions>,
  },
  GetBookingsQuery: {
    ApiPropertyOptional: {
      Status: {
        description: FIELD_DESCRIPTIONS.QUERY.BOOKING_STATUS_FILTER,
        enum: BookingStatus,
      } satisfies ApiPropertyOptions,
    },
  },
  BookingResponse: {
    ApiProperty: {
      Id: {
        description: FIELD_DESCRIPTIONS.BOOKING.ID,
        format: API_FORMATS.UUID,
        example: FIELD_DESCRIPTIONS.USER.ID_EXAMPLE,
      } satisfies ApiPropertyOptions,
      Trainer: {
        description: FIELD_DESCRIPTIONS.BOOKING.TRAINER,
        type: () => ResponseUserDto,
      } satisfies ApiPropertyOptions,
      Trainee: {
        description: FIELD_DESCRIPTIONS.BOOKING.TRAINEE,
        type: () => ResponseUserDto,
      } satisfies ApiPropertyOptions,
      Status: {
        description: FIELD_DESCRIPTIONS.BOOKING.STATUS,
        enum: BookingStatus,
      } satisfies ApiPropertyOptions,
      StartTime: {
        description: FIELD_DESCRIPTIONS.BOOKING.START_TIME,
        type: Date,
      } satisfies ApiPropertyOptions,
      EndTime: {
        description: FIELD_DESCRIPTIONS.BOOKING.END_TIME,
        type: Date,
      } satisfies ApiPropertyOptions,
    },
    ApiPropertyOptional: {
      StatusChangedAt: {
        description: 'Status changed at',
        type: Date,
        nullable: true,
      } satisfies ApiPropertyOptions,
      CancelledById: {
        description: 'Cancelled by user id',
        format: API_FORMATS.UUID,
        nullable: true,
      } satisfies ApiPropertyOptions,
      CancellationReason: {
        description: 'Cancellation reason',
        nullable: true,
      } satisfies ApiPropertyOptions,
      RejectionReason: {
        description: 'Rejection reason',
        nullable: true,
      } satisfies ApiPropertyOptions,
      CreatedAt: {
        description: FIELD_DESCRIPTIONS.BOOKING.CREATED_AT,
      } satisfies ApiPropertyOptions,
      UpdatedAt: {
        description: FIELD_DESCRIPTIONS.BOOKING.UPDATED_AT,
      } satisfies ApiPropertyOptions,
    },
  },
  GetAvailableTrainersForPeriodQuery: {
    ApiProperty: {
      StartDate: {
        description:
          'Start date (rolling period starts from this date) in YYYY-MM-DD',
        format: 'date',
        example: '2026-04-21',
      } satisfies ApiPropertyOptions,
      StartClockTime: {
        description: 'Start clock time in HH:mm (30-minute step)',
        example: '09:00',
      } satisfies ApiPropertyOptions,
      EndClockTime: {
        description: 'End clock time in HH:mm (30-minute step)',
        example: '10:00',
      } satisfies ApiPropertyOptions,
      Period: {
        description: 'Period',
        enum: ['week', 'month', 'year'] as const,
        example: 'week',
      } satisfies ApiPropertyOptions,
    },
  },
  CreateBookingsBulk: {
    ApiProperty: {
      TrainerId: {
        description: 'Trainer id',
        format: 'uuid',
        example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
      } satisfies ApiPropertyOptions,
      StartDate: {
        description: 'Start date for the series (YYYY-MM-DD)',
        format: 'date',
        example: '2026-04-21',
      } satisfies ApiPropertyOptions,
      StartClockTime: {
        description: 'Start clock time (HH:mm)',
        example: '09:00',
      } satisfies ApiPropertyOptions,
      EndClockTime: {
        description: 'End clock time (HH:mm)',
        example: '10:00',
      } satisfies ApiPropertyOptions,
      Period: {
        description: 'Period',
        enum: ['day', 'week', 'month', 'year'] as const,
        example: 'week',
      } satisfies ApiPropertyOptions,
    },
  },
  UpdateBookingStatus: {
    ApiProperty: {
      Status: {
        description: FIELD_DESCRIPTIONS.BOOKING.STATUS,
        enum: BookingStatus,
      } satisfies ApiPropertyOptions,
    },
    ApiPropertyOptional: {
      CancellationReason: {
        description: 'Cancellation reason (required when status=CANCELLED)',
      },
      RejectionReason: {
        description: 'Rejection reason (required when status=REJECTED)',
      },
    } satisfies Record<string, ApiPropertyOptions>,
  },
} as const;
