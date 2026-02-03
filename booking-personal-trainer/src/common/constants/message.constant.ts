export const ERROR_MESSAGES = {
  AUTH: {
    INVALID_EMAIL: 'Email is invalid',
    PASSWORD_MIN_LENGTH: (min: number) =>
      `Password must be at least ${min} characters long`,
    MISSING_REQUIRED_FIELDS: 'Required fields are missing',
  },
  USER: {
    NOT_FOUND: 'User not found',
    ALREADY_EXISTS: 'User already exists',
    USERNAME_TAKEN: 'Username already exists',
    EMAIL_TAKEN: 'Email already exists',
  },
  VALIDATION: {
    USERNAME_REQUIRED: 'Username is required',
    EMAIL_REQUIRED: 'User email is required',
    PASSWORD_REQUIRED: 'User password is required',
    PASSWORD_NOT_MATCH: 'Password does not match',
    LAST_NAME_REQUIRED: 'User last name is required',
    FIRST_NAME_REQUIRED: 'User first name is required',
    ROLE_REQUIRED: 'User role is required',
    TYPE_REQUIRED: 'User type is required',
  },
  SYSTEM: {
    INTERNAL_SERVER_ERROR: 'Internal server error',
  },
} as const;
