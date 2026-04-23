export const BookingAvailabilityConstants = {
  MinimumDurationMinutes: 60,
  MinimumStepMinutes: 30,
  DateLocalFormat: 'YYYY-MM-DD',
  StepMinutesMustBeThirtyMinuteIncrement:
    'Step minutes must be 30-minute increments',
  DurationMustBeMultipleOfStepMinutes:
    'Duration must be a multiple of step minutes',
} as const;
