import type { ApiPropertyOptions } from '@nestjs/swagger';

import {
  API_FORMATS,
  FIELD_DESCRIPTIONS,
} from '../../../common/constants/message.constant';
import { SortBy } from '../../../common/enums/pagination/pagination.enum';
import {
  TrainerApprovalStatus,
  UserRole,
  UserStatus,
  UserType,
} from '../../../common/enums/user/user.enum';

export const UserDtoSwagger = {
  UpdateUserRole: {
    ApiProperty: {
      Role: { description: FIELD_DESCRIPTIONS.USER.ROLE, enum: UserRole },
    } satisfies Record<string, ApiPropertyOptions>,
  },
  UpdateUserProfile: {
    ApiPropertyOptional: {
      Age: { description: FIELD_DESCRIPTIONS.USER.AGE },
      Height: { description: FIELD_DESCRIPTIONS.USER.HEIGHT },
      Weight: { description: FIELD_DESCRIPTIONS.USER.WEIGHT },
    } satisfies Record<string, ApiPropertyOptions>,
  },
  GetUsersQuery: {
    ApiPropertyOptional: {
      UserType: {
        description: FIELD_DESCRIPTIONS.QUERY.USER_TYPE_FILTER,
        enum: UserType,
      },
      Role: {
        description: FIELD_DESCRIPTIONS.QUERY.ROLE_FILTER,
        enum: UserRole,
      },
      ApprovalStatus: {
        description: FIELD_DESCRIPTIONS.QUERY.APPROVAL_STATUS_FILTER,
        enum: TrainerApprovalStatus,
      },
      Search: { description: FIELD_DESCRIPTIONS.QUERY.SEARCH },
      SortBy: { description: FIELD_DESCRIPTIONS.QUERY.SORT_BY, enum: SortBy },
    } satisfies Record<string, ApiPropertyOptions>,
  },
  ResponseUser: {
    ApiProperty: {
      Id: {
        description: FIELD_DESCRIPTIONS.USER.ID,
        format: API_FORMATS.UUID,
        example: FIELD_DESCRIPTIONS.USER.ID_EXAMPLE,
      },
      UserName: {
        description: FIELD_DESCRIPTIONS.USER.USERNAME,
        example: FIELD_DESCRIPTIONS.COMMON.USERNAME_EXAMPLE,
      },
      Email: {
        description: FIELD_DESCRIPTIONS.USER.EMAIL,
        example: FIELD_DESCRIPTIONS.COMMON.EMAIL_EXAMPLE,
      },
      FirstName: {
        description: FIELD_DESCRIPTIONS.USER.FIRST_NAME,
        example: FIELD_DESCRIPTIONS.COMMON.FIRST_NAME_EXAMPLE,
      },
      LastName: {
        description: FIELD_DESCRIPTIONS.USER.LAST_NAME,
        example: FIELD_DESCRIPTIONS.COMMON.LAST_NAME_EXAMPLE,
      },
      Role: { description: FIELD_DESCRIPTIONS.USER.ROLE, enum: UserRole },
      UserType: {
        description: FIELD_DESCRIPTIONS.USER.USER_TYPE,
        enum: UserType,
      },
      ApprovalStatus: {
        description: FIELD_DESCRIPTIONS.USER.APPROVAL_STATUS,
        enum: TrainerApprovalStatus,
      },
      Status: {
        description: FIELD_DESCRIPTIONS.USER.ACCOUNT_STATUS,
        enum: UserStatus,
      },
    } satisfies Record<string, ApiPropertyOptions>,
    ApiPropertyOptional: {
      CreatedAt: { description: FIELD_DESCRIPTIONS.USER.CREATED_AT },
      UpdatedAt: { description: FIELD_DESCRIPTIONS.USER.UPDATED_AT },
    } satisfies Record<string, ApiPropertyOptions>,
  },
  ResponseFullUser: {
    ApiProperty: {
      HasPassword: {
        description: 'Whether the account has a local password set.',
        example: true,
      },
    } satisfies Record<string, ApiPropertyOptions>,
    ApiPropertyOptional: {
      Age: { description: FIELD_DESCRIPTIONS.USER.AGE },
      Height: { description: FIELD_DESCRIPTIONS.USER.HEIGHT },
      Weight: { description: FIELD_DESCRIPTIONS.USER.WEIGHT },
      StripeAccountId: {
        description: 'Stripe Connect account id for trainer payouts.',
        nullable: true,
      },
    } satisfies Record<string, ApiPropertyOptions>,
  },
} as const;
