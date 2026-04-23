import type { ApiPropertyOptions } from '@nestjs/swagger';

import {
  API_FORMATS,
  FIELD_DESCRIPTIONS,
} from '../../../common/constants/message.constant';

export const TrainerSchedulingDtoSwagger = {
  CreateTrainerAvailability: {
    ApiProperty: {
      DayOfWeek: { example: 1, description: 'Day of week (1-7).' },
      StartTime: { example: '2026-02-01T09:00:00Z' },
      EndTime: { example: '2026-02-01T10:00:00Z' },
    } satisfies Record<string, ApiPropertyOptions>,
  },
  UpdateTrainerAvailability: {
    ApiPropertyOptional: {
      StartTime: { example: '2026-02-01T09:00:00Z' },
      EndTime: { example: '2026-02-01T10:00:00Z' },
    } satisfies Record<string, ApiPropertyOptions>,
  },
  CreateTrainerTimeOff: {
    ApiProperty: {
      Reason: { example: 'personal' },
      StartTime: { example: '2026-02-01T09:00:00Z' },
      EndTime: { example: '2026-02-01T10:00:00Z' },
    } satisfies Record<string, ApiPropertyOptions>,
  },
  UpdateTrainerTimeOff: {
    ApiPropertyOptional: {
      Reason: { example: 'personal' },
      StartTime: { example: '2026-02-01T09:00:00Z' },
      EndTime: { example: '2026-02-01T10:00:00Z' },
    } satisfies Record<string, ApiPropertyOptions>,
  },
  TrainerAvailabilityResponse: {
    ApiProperty: {
      Id: {
        description: FIELD_DESCRIPTIONS.USER.ID,
        format: API_FORMATS.UUID,
        example: FIELD_DESCRIPTIONS.USER.ID_EXAMPLE,
      },
      DayOfWeek: { description: 'Day of week (1-7).', example: 1 },
      StartTime: {
        description: 'Availability start time.',
        format: API_FORMATS.DATE_TIME,
        type: Date,
      },
      EndTime: {
        description: 'Availability end time.',
        format: API_FORMATS.DATE_TIME,
        type: Date,
      },
    } satisfies Record<string, ApiPropertyOptions>,
    ApiPropertyOptional: {
      CreatedAt: { description: FIELD_DESCRIPTIONS.BOOKING.CREATED_AT },
      UpdatedAt: { description: FIELD_DESCRIPTIONS.BOOKING.UPDATED_AT },
    } satisfies Record<string, ApiPropertyOptions>,
  },
  UpdateTrainerAvailabilityResponse: {
    ApiProperty: {
      Id: {
        description: FIELD_DESCRIPTIONS.USER.ID,
        format: API_FORMATS.UUID,
        example: FIELD_DESCRIPTIONS.USER.ID_EXAMPLE,
      },
      DayOfWeek: { description: 'Day of week (1-7).', example: 1 },
      StartTime: {
        description: 'Availability start time.',
        format: API_FORMATS.DATE_TIME,
        type: Date,
      },
      EndTime: {
        description: 'Availability end time.',
        format: API_FORMATS.DATE_TIME,
        type: Date,
      },
    } satisfies Record<string, ApiPropertyOptions>,
    ApiPropertyOptional: {
      UpdatedAt: { description: FIELD_DESCRIPTIONS.BOOKING.UPDATED_AT },
    } satisfies Record<string, ApiPropertyOptions>,
  },
  TrainerTimeOffResponse: {
    ApiProperty: {
      Id: {
        description: FIELD_DESCRIPTIONS.USER.ID,
        format: API_FORMATS.UUID,
        example: FIELD_DESCRIPTIONS.USER.ID_EXAMPLE,
      },
      Reason: { example: 'personal' },
      StartTime: {
        description: 'Time off start time.',
        format: API_FORMATS.DATE_TIME,
        type: Date,
      },
      EndTime: {
        description: 'Time off end time.',
        format: API_FORMATS.DATE_TIME,
        type: Date,
      },
    } satisfies Record<string, ApiPropertyOptions>,
    ApiPropertyOptional: {
      CreatedAt: { description: FIELD_DESCRIPTIONS.BOOKING.CREATED_AT },
      UpdatedAt: { description: FIELD_DESCRIPTIONS.BOOKING.UPDATED_AT },
    } satisfies Record<string, ApiPropertyOptions>,
  },
} as const;
