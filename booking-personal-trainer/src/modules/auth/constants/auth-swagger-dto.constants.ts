import type { ApiPropertyOptions } from '@nestjs/swagger';

type SwaggerDtoClass = new (...args: unknown[]) => unknown;

import {
  API_FORMATS,
  FIELD_DESCRIPTIONS,
} from '../../../common/constants/message.constant';
import { VALIDATION } from '../../../common/constants/validation.constant';
import {
  TrainerApprovalStatus,
  UserRole,
  UserStatus,
  UserType,
} from '../../../common/enums/user/user.enum';

export const AuthDtoSwagger = {
  Register: {
    ApiProperty: {
      Email: {
        description: FIELD_DESCRIPTIONS.COMMON.EMAIL,
        example: FIELD_DESCRIPTIONS.COMMON.EMAIL_EXAMPLE,
        format: API_FORMATS.EMAIL,
      },
      Password: {
        description: FIELD_DESCRIPTIONS.COMMON.PASSWORD,
        example: FIELD_DESCRIPTIONS.COMMON.PASSWORD_EXAMPLE,
        minLength: VALIDATION.PASSWORD_MIN_LENGTH,
        writeOnly: true,
      },
      UserName: {
        description: FIELD_DESCRIPTIONS.COMMON.USERNAME,
        example: FIELD_DESCRIPTIONS.COMMON.USERNAME_EXAMPLE,
        maxLength: VALIDATION.NAME_MAX_LENGTH,
      },
      FirstName: {
        description: FIELD_DESCRIPTIONS.COMMON.FIRST_NAME,
        example: FIELD_DESCRIPTIONS.COMMON.FIRST_NAME_EXAMPLE,
        maxLength: VALIDATION.NAME_MAX_LENGTH,
      },
      LastName: {
        description: FIELD_DESCRIPTIONS.COMMON.LAST_NAME,
        example: FIELD_DESCRIPTIONS.COMMON.LAST_NAME_EXAMPLE,
        maxLength: VALIDATION.NAME_MAX_LENGTH,
      },
      UserType: {
        description: FIELD_DESCRIPTIONS.USER.USER_TYPE_LONG,
        enum: UserType,
        example: UserType.TRAINEE,
      },
    } satisfies Record<string, ApiPropertyOptions>,
    ApiPropertyOptional: {
      Role: {
        description: FIELD_DESCRIPTIONS.USER.ROLE_DEFAULT,
        enum: UserRole,
        default: UserRole.TRAINEE,
      },
      ApprovalStatus: {
        description: FIELD_DESCRIPTIONS.USER.APPROVAL_STATUS_DEFAULT,
        enum: TrainerApprovalStatus,
        default: TrainerApprovalStatus.NONE,
      },
      Status: {
        description: FIELD_DESCRIPTIONS.USER.ACCOUNT_STATUS_DEFAULT,
        enum: UserStatus,
        default: UserStatus.ACTIVE,
      },
    } satisfies Record<string, ApiPropertyOptions>,
  },
  Login: {
    ApiProperty: {
      Email: {
        description: FIELD_DESCRIPTIONS.COMMON.EMAIL,
        example: FIELD_DESCRIPTIONS.COMMON.EMAIL_EXAMPLE,
        format: API_FORMATS.EMAIL,
      },
      Password: {
        description: FIELD_DESCRIPTIONS.COMMON.PASSWORD,
        example: FIELD_DESCRIPTIONS.COMMON.PASSWORD_EXAMPLE,
        minLength: VALIDATION.PASSWORD_MIN_LENGTH,
        writeOnly: true,
      },
    } satisfies Record<string, ApiPropertyOptions>,
  },
  AuthResponseData: {
    ApiProperty: {
      AuthUser: <T extends SwaggerDtoClass>(
        responseUserDto: T,
      ): ApiPropertyOptions => ({
        description: FIELD_DESCRIPTIONS.AUTH.AUTHENTICATED_USER,
        type: () => responseUserDto,
      }),
      AccessToken: {
        description: FIELD_DESCRIPTIONS.AUTH.ACCESS_TOKEN,
        example: FIELD_DESCRIPTIONS.AUTH.ACCESS_TOKEN_EXAMPLE,
      },
      RefreshToken: {
        description: FIELD_DESCRIPTIONS.AUTH.JWT_REFRESH_TOKEN,
        example: FIELD_DESCRIPTIONS.AUTH.ACCESS_TOKEN_EXAMPLE,
      },
      AccessTokenExpiresIn: {
        description: 'Access token expiration time in seconds',
        example: 900,
      },
      RefreshTokenExpiresIn: {
        description: 'Refresh token expiration time in seconds',
        example: 604800,
      },
    },
  },
  Token: {
    ApiProperty: {
      AccessToken: {
        description: FIELD_DESCRIPTIONS.AUTH.ACCESS_TOKEN,
        example: FIELD_DESCRIPTIONS.AUTH.ACCESS_TOKEN_EXAMPLE,
      },
      RefreshToken: {
        description: FIELD_DESCRIPTIONS.AUTH.JWT_REFRESH_TOKEN,
        example: FIELD_DESCRIPTIONS.AUTH.ACCESS_TOKEN_EXAMPLE,
      },
      RefreshTokenResponse: {
        description: FIELD_DESCRIPTIONS.AUTH.REFRESH_TOKEN_RESPONSE,
        example: FIELD_DESCRIPTIONS.AUTH.ACCESS_TOKEN_EXAMPLE,
      },
      NewRefreshToken: {
        description: FIELD_DESCRIPTIONS.AUTH.NEW_REFRESH_TOKEN,
        example: FIELD_DESCRIPTIONS.AUTH.ACCESS_TOKEN_EXAMPLE,
      },
      LogoutSuccess: {
        description: FIELD_DESCRIPTIONS.AUTH.LOGOUT_SUCCESS,
        example: true,
      },
    } satisfies Record<string, ApiPropertyOptions>,
  },
  TokenExchange: {
    ApiProperty: {
      Token: {
        description: 'Third-party JWT (RS256)',
        example: 'eyJhbGciOiJSUzI1NiIs...',
      },
    } satisfies Record<string, ApiPropertyOptions>,
  },
  LinkAuth0ToLocal: {
    ApiProperty: {
      Token: {
        description: 'Third-party JWT (RS256)',
        example: 'eyJhbGciOiJSUzI1NiIs...',
      },
      Password: {
        description: FIELD_DESCRIPTIONS.COMMON.PASSWORD,
        example: FIELD_DESCRIPTIONS.COMMON.PASSWORD_EXAMPLE,
        minLength: VALIDATION.PASSWORD_MIN_LENGTH,
        writeOnly: true,
      },
    } satisfies Record<string, ApiPropertyOptions>,
  },
  SetPassword: {
    ApiProperty: {
      NewPassword: {
        description: FIELD_DESCRIPTIONS.COMMON.PASSWORD,
        example: FIELD_DESCRIPTIONS.COMMON.PASSWORD_EXAMPLE,
        minLength: VALIDATION.PASSWORD_MIN_LENGTH,
        writeOnly: true,
      },
    } satisfies Record<string, ApiPropertyOptions>,
  },
} as const;
