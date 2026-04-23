import type { ApiPropertyOptions } from '@nestjs/swagger';

type SwaggerDtoClass = new (...args: unknown[]) => unknown;

import {
  API_FORMATS,
  FIELD_DESCRIPTIONS,
} from '../../../common/constants/message.constant';
import { WorkoutStatus } from '../../../common/enums/workout/workout.enum';

export const WorkoutDtoSwagger = {
  CreateBookingWorkout: {
    ApiProperty: {
      TemplateId: {
        description: 'Exercise template id to snapshot into the workout',
        format: API_FORMATS.UUID,
        example: '9b3b77d0-3e3c-4c0b-8a0d-1c4d2b2e2b0a',
      },
    },
    ApiPropertyOptional: {
      AmountCents: {
        description:
          'Workout price in cents (quote). If omitted, server uses DEFAULT_WORKOUT_PRICE_CENTS.',
        minimum: 1,
      },
      Currency: {
        description: 'Currency for the workout quote. Defaults to USD.',
        example: 'USD',
      },
    },
  },
  CreateWorkout: {
    ApiProperty: {
      TraineeId: {
        description: FIELD_DESCRIPTIONS.WORKOUT.TRAINEE_ID,
        format: API_FORMATS.UUID,
        example: FIELD_DESCRIPTIONS.USER.ID_EXAMPLE,
      },
      ExerciseIds: {
        description: FIELD_DESCRIPTIONS.WORKOUT.EXERCISE_IDS,
        type: [String],
        format: API_FORMATS.UUID,
        example: [FIELD_DESCRIPTIONS.USER.ID_EXAMPLE],
      } satisfies ApiPropertyOptions,
      StartTime: {
        description: FIELD_DESCRIPTIONS.WORKOUT.START_TIME,
        format: API_FORMATS.DATE_TIME,
        example: FIELD_DESCRIPTIONS.COMMON.DATE_TIME_START_EXAMPLE,
      },
      EndTime: {
        description: FIELD_DESCRIPTIONS.WORKOUT.END_TIME,
        format: API_FORMATS.DATE_TIME,
        example: FIELD_DESCRIPTIONS.COMMON.DATE_TIME_END_EXAMPLE,
      },
    },
    ApiPropertyOptional: {
      AmountCents: {
        description:
          'Workout price in cents (quote). If omitted, server uses DEFAULT_WORKOUT_PRICE_CENTS.',
        minimum: 1,
      },
      Currency: {
        description: 'Currency for the workout quote. Defaults to USD.',
        example: 'USD',
      },
    },
  },
  UpdateWorkoutDetail: {
    ApiProperty: {
      WorkoutExerciseId: {
        description: FIELD_DESCRIPTIONS.WORKOUT.WORKOUT_EXERCISE_ID,
      },
      IsCompleted: {
        description: FIELD_DESCRIPTIONS.WORKOUT.IS_COMPLETED,
      },
    },
    ApiPropertyOptional: {
      Status: {
        description: FIELD_DESCRIPTIONS.WORKOUT.STATUS,
        enum: WorkoutStatus,
      },
      ExerciseCompletions: <T extends SwaggerDtoClass>(
        exerciseCompletionDto: T,
      ): ApiPropertyOptions => ({
        description: FIELD_DESCRIPTIONS.WORKOUT.EXERCISE_COMPLETIONS,
        type: [exerciseCompletionDto],
      }),
    },
  },
  WorkoutResponse: {
    ApiProperty: {
      Id: {
        description: FIELD_DESCRIPTIONS.WORKOUT.ID,
        format: API_FORMATS.UUID,
        example: FIELD_DESCRIPTIONS.USER.ID_EXAMPLE,
      },
      WorkoutExerciseId: {
        description: FIELD_DESCRIPTIONS.WORKOUT.WORKOUT_EXERCISE_ID,
        format: API_FORMATS.UUID,
        example: FIELD_DESCRIPTIONS.USER.ID_EXAMPLE,
      },
      Order: { description: FIELD_DESCRIPTIONS.WORKOUT.ORDER },
      IsCompleted: { description: FIELD_DESCRIPTIONS.WORKOUT.IS_COMPLETED },
      Exercise: {
        description: FIELD_DESCRIPTIONS.EXERCISE.NAME,
        type: () => Object,
      },
      StartTime: {
        description: FIELD_DESCRIPTIONS.WORKOUT.START_TIME,
        type: Date,
      },
      EndTime: { description: FIELD_DESCRIPTIONS.WORKOUT.END_TIME, type: Date },
      Status: {
        description: FIELD_DESCRIPTIONS.WORKOUT.STATUS,
        enum: WorkoutStatus,
      },
      Trainer: {
        description: FIELD_DESCRIPTIONS.WORKOUT.TRAINER,
        type: () => Object,
      },
      Trainee: {
        description: FIELD_DESCRIPTIONS.WORKOUT.TRAINEE,
        type: () => Object,
      },
      Exercises: <T extends SwaggerDtoClass>(
        workoutExerciseResponseDto: T,
      ): ApiPropertyOptions => ({
        description: FIELD_DESCRIPTIONS.WORKOUT.EXERCISES,
        type: [workoutExerciseResponseDto],
      }),
    },
    ApiPropertyOptional: {
      Sets: { description: 'Sets', nullable: true },
      Reps: { description: 'Reps', nullable: true },
      RestSeconds: { description: 'Rest seconds', nullable: true },
      Notes: { description: 'Notes' },
      BookingId: {
        description: 'Booking id',
        format: API_FORMATS.UUID,
        nullable: true,
      },
      TemplateId: {
        description: 'Template id',
        format: API_FORMATS.UUID,
        nullable: true,
      },
      TotalExercises: {
        description: FIELD_DESCRIPTIONS.WORKOUT.TOTAL_EXERCISES,
      },
      CompletedExercises: {
        description: FIELD_DESCRIPTIONS.WORKOUT.COMPLETED_EXERCISES,
      },
      CreatedAt: { description: FIELD_DESCRIPTIONS.WORKOUT.CREATED_AT },
      UpdatedAt: { description: FIELD_DESCRIPTIONS.WORKOUT.UPDATED_AT },
    },
  },
  WorkoutsQuery: {
    ApiPropertyOptional: {
      Page: { description: FIELD_DESCRIPTIONS.QUERY.PAGE, default: 1 },
      Limit: { description: FIELD_DESCRIPTIONS.QUERY.LIMIT, default: 20 },
      TrainerId: {
        description: FIELD_DESCRIPTIONS.QUERY.TRAINER_ID_FILTER,
        format: API_FORMATS.UUID,
        example: FIELD_DESCRIPTIONS.USER.ID_EXAMPLE,
      },
      TraineeId: {
        description: FIELD_DESCRIPTIONS.QUERY.TRAINEE_ID_FILTER,
        format: API_FORMATS.UUID,
        example: FIELD_DESCRIPTIONS.USER.ID_EXAMPLE,
      },
      Status: {
        description: FIELD_DESCRIPTIONS.QUERY.WORKOUT_STATUS_FILTER,
        enum: WorkoutStatus,
      },
    },
  },
} as const;
