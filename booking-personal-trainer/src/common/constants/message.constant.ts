export const ERROR_MESSAGES = {
  AUTH: {
    INVALID_EMAIL: 'Email is invalid',
    PASSWORD_MIN_LENGTH: (min: number) =>
      `Password must be at least ${min} characters long`,
    MISSING_REQUIRED_FIELDS: 'Required fields are missing',
    INVALID_REFRESH_TOKEN: 'Refresh token is invalid or expired',
    REFRESH_TOKEN_REQUIRED: 'Refresh token is required',
    REFRESH_TOKEN_EXPIRED: 'Refresh token is expired',
    REFRESH_TOKEN_NOT_FOUND: 'Refresh token not found',
    ACCESS_TOKEN_INVALID: 'Access token is invalid or expired',
    UNAUTHORIZED: 'You are not authorized to perform this action',
    FORBIDDEN: 'You do not have permission to perform this action',
  },
  USER: {
    NOT_FOUND: 'User not found',
    ALREADY_EXISTS: 'User already exists',
    USERNAME_TAKEN: 'Username already exists',
    EMAIL_TAKEN: 'Email already exists',
    ADMIN_UPDATE: 'Cannot update role of another admin',
    CANNOT_UPDATE_SELF_ROLE: 'You cannot update your own role',
    CANNOT_ASSIGN_ADMIN: 'You cannot assign admin role to other users',
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
