import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

// Commons
import {
  TrainerApprovalStatus,
  UserRole,
  UserStatus,
  UserType,
} from '../../../common/enums/user/user.enum';
import {
  API_FORMATS,
  FIELD_DESCRIPTIONS,
} from '../../../common/constants/message.constant';

export class ResponseUserDto {
  @ApiProperty({
    description: FIELD_DESCRIPTIONS.USER.ID,
    format: API_FORMATS.UUID,
    example: FIELD_DESCRIPTIONS.USER.ID_EXAMPLE,
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: FIELD_DESCRIPTIONS.USER.USERNAME,
    example: FIELD_DESCRIPTIONS.COMMON.USERNAME_EXAMPLE,
  })
  @Expose()
  userName: string;

  @ApiProperty({
    description: FIELD_DESCRIPTIONS.USER.EMAIL,
    example: FIELD_DESCRIPTIONS.COMMON.EMAIL_EXAMPLE,
  })
  @Expose()
  email: string;

  @ApiProperty({
    description: FIELD_DESCRIPTIONS.USER.FIRST_NAME,
    example: FIELD_DESCRIPTIONS.COMMON.FIRST_NAME_EXAMPLE,
  })
  @Expose()
  firstName: string;

  @ApiProperty({
    description: FIELD_DESCRIPTIONS.USER.LAST_NAME,
    example: FIELD_DESCRIPTIONS.COMMON.LAST_NAME_EXAMPLE,
  })
  @Expose()
  lastName: string;

  @ApiProperty({
    description: FIELD_DESCRIPTIONS.USER.ROLE,
    enum: UserRole,
  })
  @Expose()
  role: UserRole;

  @ApiProperty({
    description: FIELD_DESCRIPTIONS.USER.USER_TYPE,
    enum: UserType,
  })
  @Expose()
  userType: UserType;

  @ApiProperty({
    description: FIELD_DESCRIPTIONS.USER.APPROVAL_STATUS,
    enum: TrainerApprovalStatus,
  })
  @Expose()
  approvalStatus: TrainerApprovalStatus;

  @ApiProperty({
    description: FIELD_DESCRIPTIONS.USER.ACCOUNT_STATUS,
    enum: UserStatus,
  })
  @Expose()
  status: UserStatus;

  @ApiPropertyOptional({ description: FIELD_DESCRIPTIONS.USER.CREATED_AT })
  @Expose()
  createdAt?: Date;

  @ApiPropertyOptional({ description: FIELD_DESCRIPTIONS.USER.UPDATED_AT })
  @Expose()
  updatedAt?: Date;
}

export class ResponseFullUserDto extends ResponseUserDto {
  @ApiPropertyOptional({ description: FIELD_DESCRIPTIONS.USER.AGE })
  @Expose()
  age?: number;

  @ApiPropertyOptional({ description: FIELD_DESCRIPTIONS.USER.HEIGHT })
  @Expose()
  height?: number;

  @ApiPropertyOptional({ description: FIELD_DESCRIPTIONS.USER.WEIGHT })
  @Expose()
  weight?: number;

  @ApiPropertyOptional({
    description: 'Stripe Connect account id for trainer payouts.',
    nullable: true,
  })
  @Expose()
  stripeAccountId?: string | null;
}
