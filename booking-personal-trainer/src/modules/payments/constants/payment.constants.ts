export const PAYMENT_INTENT = {
  OPERATIONS: {
    CREATE: 'create_payment_intent',
    CREATE_RETRY: 'create_payment_intent_retry',
  },
  TYPES: {
    WORKOUT: 'WORKOUT',
  },
  STATUS: {
    CREATED: 'created',
    SUCCEEDED: 'succeeded',
    CANCELED: 'canceled',
    PROCESSING: 'processing',
    REQUIRES_PAYMENT_METHOD: 'requires_payment_method',
    REQUIRES_CONFIRMATION: 'requires_confirmation',
    REQUIRES_ACTION: 'requires_action',
  },
};

export const SETTLEMENT_MODEL = 'PLATFORM_COLLECT' as const;

export const PAYMENT_STATUS = {
  TRANSFERRED: 'TRANSFERRED',
  SKIPPED_ZERO_SHARE: 'SKIPPED_ZERO_SHARE',
  AWAITING_TRAINER_CONNECT: 'AWAITING_TRAINER_CONNECT',
  FAILED: 'FAILED',
  UNKNOWN: 'UNKNOWN',
} as const;
