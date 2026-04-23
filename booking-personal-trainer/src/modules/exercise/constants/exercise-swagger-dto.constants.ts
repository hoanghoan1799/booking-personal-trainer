import type { ApiPropertyOptions } from '@nestjs/swagger';

import {
  API_FORMATS,
  FIELD_DESCRIPTIONS,
} from '../../../common/constants/message.constant';
import {
  Equipment,
  MuscleGroup,
} from '../../../common/enums/exercise/exercise.enum';

export const ExerciseDtoSwagger = {
  CreateExercise: {
    ApiProperty: {
      Name: { description: FIELD_DESCRIPTIONS.EXERCISE.NAME },
      MuscleGroup: {
        description: FIELD_DESCRIPTIONS.EXERCISE.MUSCLE_GROUP,
        enum: MuscleGroup,
      },
      Equipment: {
        description: FIELD_DESCRIPTIONS.EXERCISE.EQUIPMENT,
        enum: Equipment,
      },
    } satisfies Record<string, ApiPropertyOptions>,
    ApiPropertyOptional: {
      Description: { description: FIELD_DESCRIPTIONS.EXERCISE.DESCRIPTION },
      ThumbnailUrl: {
        description: FIELD_DESCRIPTIONS.EXERCISE.THUMBNAIL_URL,
        format: API_FORMATS.URI,
      },
      VideoUrl: {
        description: FIELD_DESCRIPTIONS.EXERCISE.VIDEO_URL,
        format: API_FORMATS.URI,
      },
      IsDeleted: { description: FIELD_DESCRIPTIONS.EXERCISE.IS_DELETED },
    } satisfies Record<string, ApiPropertyOptions>,
  },
  ExercisesQuery: {
    ApiPropertyOptional: {
      MuscleGroup: {
        description: FIELD_DESCRIPTIONS.QUERY.MUSCLE_GROUP_FILTER,
        enum: MuscleGroup,
      },
      Equipment: {
        description: FIELD_DESCRIPTIONS.QUERY.EQUIPMENT_FILTER,
        enum: Equipment,
      },
      Search: { description: FIELD_DESCRIPTIONS.QUERY.EXERCISE_SEARCH },
    } satisfies Record<string, ApiPropertyOptions>,
  },
  ExerciseResponse: {
    ApiProperty: {
      Id: {
        description: FIELD_DESCRIPTIONS.EXERCISE.ID,
        format: API_FORMATS.UUID,
        example: FIELD_DESCRIPTIONS.USER.ID_EXAMPLE,
      },
      Name: { description: FIELD_DESCRIPTIONS.EXERCISE.NAME },
      MuscleGroup: { description: FIELD_DESCRIPTIONS.EXERCISE.MUSCLE_GROUP },
      Equipment: { description: FIELD_DESCRIPTIONS.EXERCISE.EQUIPMENT },
    } satisfies Record<string, ApiPropertyOptions>,
    ApiPropertyOptional: {
      Description: { description: FIELD_DESCRIPTIONS.EXERCISE.DESCRIPTION },
      ThumbnailUrl: {
        description: FIELD_DESCRIPTIONS.EXERCISE.THUMBNAIL_URL,
        format: API_FORMATS.URI,
      },
      VideoUrl: {
        description: FIELD_DESCRIPTIONS.EXERCISE.VIDEO_URL,
        format: API_FORMATS.URI,
      },
    } satisfies Record<string, ApiPropertyOptions>,
  },
  ResponseExercise: {
    ApiProperty: {
      Id: {
        description: FIELD_DESCRIPTIONS.EXERCISE.ID,
        format: API_FORMATS.UUID,
        example: FIELD_DESCRIPTIONS.USER.ID_EXAMPLE,
      },
      Name: { description: FIELD_DESCRIPTIONS.EXERCISE.NAME },
      MuscleGroup: {
        description: FIELD_DESCRIPTIONS.EXERCISE.MUSCLE_GROUP,
        enum: MuscleGroup,
      },
      Equipment: {
        description: FIELD_DESCRIPTIONS.EXERCISE.EQUIPMENT,
        enum: Equipment,
      },
    } satisfies Record<string, ApiPropertyOptions>,
    ApiPropertyOptional: {
      Description: { description: FIELD_DESCRIPTIONS.EXERCISE.DESCRIPTION },
      ThumbnailUrl: {
        description: FIELD_DESCRIPTIONS.EXERCISE.THUMBNAIL_URL,
        format: API_FORMATS.URI,
      },
      VideoUrl: {
        description: FIELD_DESCRIPTIONS.EXERCISE.VIDEO_URL,
        format: API_FORMATS.URI,
      },
    } satisfies Record<string, ApiPropertyOptions>,
  },
} as const;
