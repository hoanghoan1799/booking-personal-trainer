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
    INVALID_TOKEN: 'Token is invalid or expired',
    THIRD_PARTY_NOT_CONFIGURED:
      'Third-party authentication is not configured. Please contact support.',
    EMAIL_MISSING: 'Email is required',
    LOGIN_USE_NO_PASSWORD:
      'This account has no password. Sign in with third-party provider instead.',
    EMAIL_NOT_VERIFIED:
      'Email is not verified with the third-party provider. Please verify your email and try again.',
    ACCOUNT_LINK_REQUIRED:
      'ACCOUNT_LINK_REQUIRED: This email already has an account. Enter your existing password to link it with Auth0.',
    PASSWORD_SETUP_REQUIRED:
      'This account does not have a password yet. Create a password in your profile to enable email/password login.',
  },

  USER: {
    NOT_FOUND: 'User not found',
    ALREADY_EXISTS: 'User already exists',
    USERNAME_TAKEN: 'Username already exists',
    EMAIL_TAKEN: 'Email already exists',
    ADMIN_UPDATE: 'Cannot update role of another admin',
    CANNOT_UPDATE_SELF_ROLE: 'You cannot update your own role',
    CANNOT_ASSIGN_ADMIN: 'You cannot assign admin role to other users',
    TRAINER_NOT_AVAILABLE: 'Trainer is not available',
    TRAINER_APPLICATION_ALREADY_PENDING:
      'A trainer application is already pending for your account.',
    TRAINER_APPLICATION_ALREADY_APPROVED:
      'Your trainer application is already approved.',
    CANNOT_REQUEST_TRAINER_ROLE:
      'Only accounts with the trainee role can submit a trainer application.',
    TRAINER_APPLICATION_INVALID_STATE:
      'Unable to submit a trainer application for the current account state.',
  },

  TRAINER: {
    AVAILABILITY_NOT_FOUND: 'Trainer availability not found',
    TIME_OFF_NOT_FOUND: 'Trainer time off not found',
    AVAILABILITY_MIN_ONE_HOUR: 'Availability must be at least 1 hour.',
    TIME_OFF_MIN_THIRTY_MINUTES: 'Time off must be at least 30 minutes.',
    SCHEDULE_SLOT_OVERLAP:
      'This time range overlaps an existing availability or time off.',
    TIME_OFF_NOTHING_TO_UPDATE:
      'Provide at least one field (reason, start time, or end time) to update.',
    CONNECT_STRIPE: 'Only trainers can onboard Stripe Connect',
  },
  TRAINEE: {
    NOT_FOUND: 'Trainee not found',
  },

  WORKOUT: {
    INVALID_EXERCISES: 'Exercises are not available',
    INVALID_TIME_RANGE: 'Start time must be before end time',
    NOT_FOUND: 'Workout not found',
    CANNOT_UPDATE_STATUS: 'You cannot update this workout status',
    CANNOT_UPDATE_EXERCISES:
      'You cannot update exercise completion for this workout',
    EXERCISE_NOT_FOUND: 'Workout exercise not found',
    NOT_ALLOWED_TO_PAY: 'You are not allowed to pay',
    CAN_NOT_PAY: 'You can not pay for this workout',
    NO_ACTIVE_BILLING_CHARGE: 'No active billing charge found for this workout',
    ALREADY_PAID: 'You have already paid for this workout',
    REQUIRED_PAID: 'Workout must be paid before starting',
  },

  EXERCISE: {
    NOT_FOUND: 'Exercise not found',
  },

  TEMPLATE: {
    CANNOT_FORK_OWN_TEMPLATE: 'You cannot fork your own trainer template',
    CANNOT_UPDATE_NOT_OWNED_TEMPLATE:
      'You cannot update a template that you do not own',
    CANNOT_DELETE_NOT_OWNED_TEMPLATE:
      'You cannot delete a template that you do not own',
    CANNOT_EDIT_NOT_OWNED_TEMPLATE:
      'You cannot edit a template that you do not own',
    CANNOT_USE_TEMPLATE: 'You cannot use a template that you do not own',
    NOT_FOUND: 'Template not found',
  },

  BOOKING: {
    INVALID_TIME_RANGE: 'Start time must be before end time',
    CANNOT_BOOK_SELF: 'You cannot book yourself',
    TIME_SLOT_NOT_AVAILABLE: 'Time slot is not available',
    CANNOT_BOOK_IN_PAST: 'You can not book in the past',
    MUST_BOOK_BEFORE_30_MINUTES: 'You must book before 30 minutes',
    NOT_FOUND: 'Booking not found',
    CANNOT_UPDATE_STATUS: 'You cannot update this booking status',
    REJECT_REASON_REQUIRED: 'Reject reason is required',
    CANCEL_REASON_REQUIRED: 'Cancellation reason is required',
    CANNOT_BOOK_CANCELLED_OR_REJECTED_BOOKING:
      'This Booking has been cancelled or rejected',
    ALREADY_EXISTS_WORKOUT: 'Workout already exists for this booking',
  },

  STRIPE: {
    MISSING_STRIPE_CONFIG: 'Missing Stripe configuration',
    MISSING_URL: 'FRONTEND_URL is required for Stripe onboarding links',
    INVALID_STRIPE_SIGNATURE: 'Invalid Stripe webhook payload or signature',
    MISSING_RAW_BODY: 'Missing raw body for Stripe webhook verification',
    MISSING_SIGNATURE_HEADER: 'Missing Stripe signature header',
  },

  EMAIL: {},

  PAYMENT: {
    REQUIRED_AMOUNT_CENTS: 'Amount cents is required',
    INVALID_DEFAULT_WORKOUT_PRICE_CENTS: 'default workout price is invalid',
  },

  QUEUE: {
    UNKNOWN_EMAIL_QUEUE_ERROR: 'Unknown email queue error',
    FAILED_EMAIL_QUEUE: 'Failed to enqueue email',
  },

  BILLING: {
    MIN_AMOUNT: 'Amount must be greater than 0',
    CHARGE_NOT_FOUND: 'Billing charge not found',
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

  DATE: {
    INVALID_START_DATE: 'Invalid start date',
    INVALID_END_DATE: 'Invalid end date',
    INVALID_TIME_RANGE: 'Start time must be before end time',
    INVALID_DATE_FORMAT: 'Invalid date format',
    INVALID_TIME_FORMAT: 'Invalid time format',
    INVALID_OCCURRENCE: 'Invalid occurrence',
  },

  SYSTEM: {
    INTERNAL_SERVER_ERROR: 'Internal Server Error',
  },
} as const;

export const SUCCESS_MESSAGES = {
  AUTH: {
    TOKEN_REFRESHED: 'Access token refreshed successfully',
    LOGGED_OUT: 'Logged out successfully',
  },
  USER: {
    CREATED: 'User created successfully',
    UPDATED: 'User updated successfully',
    DELETED: 'User deleted successfully',
    LOGGED_IN: 'User logged in successfully',
    PROFILE_RETRIEVED: 'User profile retrieved successfully',
    PROFILE_UPDATED: 'User profile updated successfully',
    LIST_RETRIEVED: 'Users listed successfully',
    ROLE_UPDATED: 'User role updated successfully',
    TRAINER_APPLICATION_SUBMITTED: 'Trainer application submitted successfully',
  },
  EXERCISE: {
    CREATED: 'Exercise created successfully',
    UPDATED: 'Exercise updated successfully',
    DELETED: 'Exercise deleted successfully',
    RESTORED: 'Exercise restored successfully',
    LIST_RETRIEVED: 'Exercises listed successfully',
    RETRIEVED: 'Exercise retrieved successfully',
  },
  BOOKING: {
    CREATED: 'Booking created successfully',
    UPDATED: 'Booking updated successfully',
    DELETED: 'Booking deleted successfully',
    LIST_RETRIEVED: 'Bookings listed successfully',
    RETRIEVED: 'Booking retrieved successfully',
    STATUS_UPDATED: 'Booking status updated successfully',
  },
  WORKOUT: {
    CREATED: 'Workout created successfully',
    UPDATED: 'Workout updated successfully',
    DELETED: 'Workout deleted successfully',
    LIST_RETRIEVED: 'Workouts listed successfully',
    RETRIEVED: 'Workout retrieved successfully',
    DETAIL_UPDATED: 'Workout detail updated successfully',
  },
  TRAINER_SCHEDULING: {
    AVAILABILITY_LIST_RETRIEVED:
      'Trainer availabilities retrieved successfully',
    AVAILABILITY_CREATED: 'Trainer availability created successfully',
    AVAILABILITY_UPDATED: 'Trainer availability updated successfully',
    AVAILABILITY_DELETED: 'Trainer availability deleted successfully',
    TIME_OFF_LIST_RETRIEVED: 'Trainer time off retrieved successfully',
    TIME_OFF_CREATED: 'Trainer time off created successfully',
    TIME_OFF_UPDATED: 'Trainer time off updated successfully',
    TIME_OFF_DELETED: 'Trainer time off deleted successfully',
  },
} as const;

/** API operation summaries and descriptions for OpenAPI/Swagger documentation. */
export const API_DESCRIPTIONS = {
  AUTH: {
    REGISTER_SUMMARY: 'Register a new user',
    REGISTER_DESCRIPTION:
      'Creates a new user account and returns access token, refresh token, and user in the response body.',
    LOGIN_SUMMARY: 'Authenticate user (login)',
    LOGIN_DESCRIPTION:
      'Authenticates with email and password. Returns access token, refresh token, and user in the response body.',
    TOKEN_EXCHANGE_SUMMARY: 'Exchange third-party JWT for application tokens',
    TOKEN_EXCHANGE_DESCRIPTION:
      'Verifies an third-party JWT and returns an access token (RS256) and ID token (RS256). If the JWT is valid, otherwise returns the same tokens as password login.',
    REFRESH_TOKEN_SUMMARY: 'Refresh access token',
    REFRESH_TOKEN_DESCRIPTION:
      'Issues new access and refresh tokens. Requires refresh token in request body.',
    LOGOUT_SUMMARY: 'Log out',
    LOGOUT_DESCRIPTION:
      'Invalidates the session by revoking the refresh token. Pass refresh token in request body.',
    PROFILE_SUMMARY: 'Get current user profile',
    PROFILE_DESCRIPTION:
      'Returns the authenticated user profile. Requires a valid JWT in Authorization Bearer header.',
  },
  USER: {
    GET_ALL_SUMMARY: 'List users',
    GET_ALL_DESCRIPTION:
      'Returns users with optional filters (userType, role, approvalStatus, search) and pagination. ADMIN: all users; TRAINER: trainees or approved trainers; TRAINEE: approved trainers only.',
    UPDATE_PROFILE_SUMMARY: 'Update current user profile',
    UPDATE_PROFILE_DESCRIPTION:
      'Updates the authenticated user profile (age, height, weight).',
    UPDATE_ROLE_SUMMARY: 'Update user role',
    UPDATE_ROLE_DESCRIPTION:
      'Updates a user role (admin only). Cannot update own role, assign admin, or update another admin.',
    REQUEST_TRAINER_ROLE_SUMMARY: 'Request trainer role (trainee)',
    REQUEST_TRAINER_ROLE_DESCRIPTION:
      'Submits a trainer application: sets user type to trainer and approval status to pending for admin review. Trainee role only.',
  },
  EXERCISE: {
    CREATE_SUMMARY: 'Create exercise',
    CREATE_DESCRIPTION:
      'Creates a new exercise. Admin only. Requires name, muscleGroup, and equipment.',
    GET_ALL_SUMMARY: 'List exercises',
    GET_ALL_DESCRIPTION:
      'Returns exercises with optional filters (muscleGroup, equipment, search) and pagination. Admin and Trainer can access.',
    GET_ONE_SUMMARY: 'Get exercise by ID',
    GET_ONE_DESCRIPTION:
      'Returns a single exercise by ID. All authenticated users can access.',
    UPDATE_SUMMARY: 'Update exercise',
    UPDATE_DESCRIPTION:
      'Updates an exercise by ID. Admin only. All fields are optional.',
    DELETE_SUMMARY: 'Delete exercise',
    DELETE_DESCRIPTION:
      'Soft deletes an exercise by ID. Admin only. Sets isDeleted flag to true.',
    RESTORE_SUMMARY: 'Restore deleted exercise',
    RESTORE_DESCRIPTION:
      'Restores a soft-deleted exercise by ID. Sets isDeleted flag to false.',
  },
  BOOKING: {
    CREATE_SUMMARY: 'Create booking',
    CREATE_DESCRIPTION:
      'Creates a new booking with a trainer. Start time must be at least 30 minutes in the future. Cannot book yourself or overlapping time slots.',
    GET_ALL_SUMMARY: 'List bookings',
    GET_ALL_DESCRIPTION:
      'Returns bookings with optional filters (status, traineeId, trainerId) and pagination. ADMIN: all bookings; TRAINER: own bookings; TRAINEE: own bookings.',
    GET_ONE_SUMMARY: 'Get booking by ID',
    GET_ONE_DESCRIPTION: 'Returns a single booking by ID.',
    UPDATE_STATUS_SUMMARY: 'Update booking status',
    UPDATE_STATUS_DESCRIPTION:
      'Updates booking status (admin or trainer of the booking only). Status can be PENDING, CONFIRMED, REJECTED, or CANCELLED.',
  },
  WORKOUT: {
    CREATE_SUMMARY: 'Create workout',
    CREATE_DESCRIPTION:
      'Creates a new workout for a trainee with exercises. Admin and Trainer can create workouts. Start time must be before end time.',
    GET_ALL_SUMMARY: 'List workouts',
    GET_ALL_DESCRIPTION:
      'Returns workouts with optional filters (trainerId, traineeId, status) and pagination. ADMIN: all workouts; TRAINER: own workouts; TRAINEE: own workouts.',
    GET_ONE_SUMMARY: 'Get workout by ID',
    GET_ONE_DESCRIPTION: 'Returns a single workout by ID with exercises.',
    UPDATE_DETAIL_SUMMARY: 'Update workout detail',
    UPDATE_DETAIL_DESCRIPTION:
      'Updates workout status and/or exercise completion status. Admin or trainer of the workout can update.',
    DELETE_SUMMARY: 'Delete all workouts',
    DELETE_DESCRIPTION: 'Deletes all workouts (admin/trainer only).',
  },
  TRAINER_SCHEDULING: {
    GET_MY_AVAILABILITIES_SUMMARY: 'Get my weekly availability',
    GET_MY_AVAILABILITIES_DESCRIPTION:
      'Returns the authenticated trainer weekly availability with pagination meta.',
    CREATE_MY_AVAILABILITY_SUMMARY: 'Create my availability',
    CREATE_MY_AVAILABILITY_DESCRIPTION:
      'Creates a new availability slot for the authenticated trainer.',
    UPDATE_MY_AVAILABILITY_SUMMARY: 'Update my availability',
    UPDATE_MY_AVAILABILITY_DESCRIPTION:
      'Updates an availability slot owned by the authenticated trainer.',
    DELETE_MY_AVAILABILITY_SUMMARY: 'Delete my availability',
    DELETE_MY_AVAILABILITY_DESCRIPTION:
      'Deletes an availability slot owned by the authenticated trainer.',
    GET_MY_TIME_OFF_SUMMARY: 'Get my time off',
    GET_MY_TIME_OFF_DESCRIPTION:
      'Returns the authenticated trainer time off entries with pagination meta.',
    CREATE_MY_TIME_OFF_SUMMARY: 'Create my time off',
    CREATE_MY_TIME_OFF_DESCRIPTION:
      'Creates a new time off entry for the authenticated trainer.',
    UPDATE_MY_TIME_OFF_SUMMARY: 'Update my time off',
    UPDATE_MY_TIME_OFF_DESCRIPTION:
      'Updates a time off entry owned by the authenticated trainer.',
    DELETE_MY_TIME_OFF_SUMMARY: 'Delete my time off',
    DELETE_MY_TIME_OFF_DESCRIPTION:
      'Deletes a time off entry owned by the authenticated trainer.',
  },
} as const;

/** OpenAPI/Swagger string formats for ApiProperty (e.g. format: 'email'). */
export const API_FORMATS = {
  EMAIL: 'email',
  URI: 'uri',
  DATE_TIME: 'date-time',
  UUID: 'uuid',
} as const;

/** API parameter names for @ApiParam decorator. */
export const API_PARAM_NAMES = {
  ID: 'id',
  USER_ID: 'userId',
} as const;

/** Field descriptions and examples for DTOs and OpenAPI/Swagger ApiProperty. */
export const FIELD_DESCRIPTIONS = {
  COMMON: {
    EMAIL: 'User email address',
    EMAIL_EXAMPLE: 'user@example.com',
    PASSWORD: 'User password',
    PASSWORD_EXAMPLE: 'password123',
    USERNAME: 'Unique username',
    USERNAME_EXAMPLE: 'johndoe',
    FIRST_NAME: 'User first name',
    FIRST_NAME_EXAMPLE: 'John',
    LAST_NAME: 'User last name',
    LAST_NAME_EXAMPLE: 'Doe',
    DATE_TIME_START_EXAMPLE: '2024-12-25T10:00:00Z',
    DATE_TIME_END_EXAMPLE: '2024-12-25T11:00:00Z',
  },
  USER: {
    ID: 'Unique user identifier',
    ID_EXAMPLE: '550e8400-e29b-41d4-a716-446655440000',
    USERNAME: 'Username',
    EMAIL: 'User email',
    FIRST_NAME: 'First name',
    LAST_NAME: 'Last name',
    ROLE: 'User role',
    USER_TYPE: 'User type',
    USER_TYPE_LONG: 'User type (trainer or trainee)',
    APPROVAL_STATUS: 'Trainer approval status',
    APPROVAL_STATUS_DEFAULT:
      'Trainer approval status. Defaults to NONE for trainee, PENDING for trainer.',
    ACCOUNT_STATUS: 'Account status',
    ACCOUNT_STATUS_DEFAULT: 'User account status. Defaults to ACTIVE.',
    ROLE_DEFAULT: 'User role. Defaults to TRAINEE.',
    CREATED_AT: 'Creation timestamp',
    UPDATED_AT: 'Last update timestamp',
    AGE: 'User age in years',
    HEIGHT: 'User height in cm',
    WEIGHT: 'User weight in kg',
  },
  AUTH: {
    AUTHENTICATED_USER: 'Authenticated user',
    ACCESS_TOKEN: 'JWT access token',
    ACCESS_TOKEN_EXAMPLE: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    ACCESS_TOKEN_SWAGGER_HINT:
      'JWT access token. Copy this value and paste it in Authorize (Bearer) above to test protected endpoints.',
    REFRESH_TOKEN_RESPONSE: 'New JWT access token and refresh token.',
    LOGOUT_SUCCESS: 'Whether logout was successful',
    RESPONSE_DATA: 'Response data',
    JWT_REFRESH_TOKEN: 'JWT refresh token',
    NEW_REFRESH_TOKEN: 'New JWT refresh token',
  },
  QUERY: {
    PAGE: 'Page number (1-based)',
    LIMIT: 'Number of items per page',
    ORDER: 'Sort order (ASC or DESC)',
    SEARCH: 'Search by email or username',
    SORT_BY: 'Sort field (createdAt, email, name)',
    USER_TYPE_FILTER: 'Filter by user type',
    ROLE_FILTER: 'Filter by role',
    APPROVAL_STATUS_FILTER: 'Filter by trainer approval status',
    MUSCLE_GROUP_FILTER: 'Filter by muscle group',
    EQUIPMENT_FILTER: 'Filter by equipment',
    EXERCISE_SEARCH: 'Search by exercise name',
    BOOKING_STATUS_FILTER: 'Filter by booking status',
    TRAINEE_ID_FILTER: 'Filter by trainee ID (admin only)',
    TRAINER_ID_FILTER: 'Filter by trainer ID (admin only)',
    WORKOUT_STATUS_FILTER: 'Filter by workout status',
  },
  EXERCISE: {
    ID: 'Unique exercise identifier',
    NAME: 'Exercise name',
    DESCRIPTION: 'Exercise description',
    MUSCLE_GROUP: 'Muscle group targeted',
    EQUIPMENT: 'Equipment required',
    THUMBNAIL_URL: 'Thumbnail image URL',
    VIDEO_URL: 'Video demonstration URL',
    IS_DELETED: 'Whether exercise is soft deleted',
  },
  BOOKING: {
    ID: 'Unique booking identifier',
    TRAINER_ID: 'Trainer user ID',
    TRAINEE_ID: 'Trainee user ID',
    START_TIME: 'Booking start time (ISO 8601 date string)',
    END_TIME: 'Booking end time (ISO 8601 date string)',
    STATUS: 'Booking status',
    TRAINER: 'Trainer user details',
    TRAINEE: 'Trainee user details',
    CREATED_AT: 'Creation timestamp',
    UPDATED_AT: 'Last update timestamp',
  },
  WORKOUT: {
    ID: 'Unique workout identifier',
    TRAINER_ID: 'Trainer user ID',
    TRAINEE_ID: 'Trainee user ID',
    START_TIME: 'Workout start time (ISO 8601 date string)',
    END_TIME: 'Workout end time (ISO 8601 date string)',
    STATUS: 'Workout status',
    TRAINER: 'Trainer user details',
    TRAINEE: 'Trainee user details',
    EXERCISE_IDS: 'Array of exercise IDs',
    EXERCISES: 'Workout exercises with completion status',
    EXERCISE_COMPLETIONS: 'Array of exercise completion updates',
    WORKOUT_EXERCISE_ID: 'Workout exercise identifier',
    IS_COMPLETED: 'Whether exercise is completed',
    ORDER: 'Exercise order in workout',
    TOTAL_EXERCISES: 'Total number of exercises',
    COMPLETED_EXERCISES: 'Number of completed exercises',
    PROGRESS: 'Workout progress percentage',
    CREATED_AT: 'Creation timestamp',
    UPDATED_AT: 'Last update timestamp',
  },
} as const;
