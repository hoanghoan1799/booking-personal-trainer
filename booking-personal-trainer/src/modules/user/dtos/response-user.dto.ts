import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';

// Commons
import {
  TrainerApprovalStatus,
  UserRole,
  UserStatus,
  UserType,
} from '../../../common/enums/user/user.enum';
import { UserDtoSwagger } from '../constants/user-swagger-dto.constants';

export class ResponseUserDto {
  @ApiProperty(UserDtoSwagger.ResponseUser.ApiProperty.Id)
  @Expose()
  id: string;

  @ApiProperty(UserDtoSwagger.ResponseUser.ApiProperty.UserName)
  @Expose()
  userName: string;

  @ApiProperty(UserDtoSwagger.ResponseUser.ApiProperty.Email)
  @Expose()
  email: string;

  @ApiProperty(UserDtoSwagger.ResponseUser.ApiProperty.FirstName)
  @Expose()
  firstName: string;

  @ApiProperty(UserDtoSwagger.ResponseUser.ApiProperty.LastName)
  @Expose()
  lastName: string;

  @ApiProperty(UserDtoSwagger.ResponseUser.ApiProperty.Role)
  @Expose()
  role: UserRole;

  @ApiProperty(UserDtoSwagger.ResponseUser.ApiProperty.UserType)
  @Expose()
  userType: UserType;

  @ApiProperty(UserDtoSwagger.ResponseUser.ApiProperty.ApprovalStatus)
  @Expose()
  approvalStatus: TrainerApprovalStatus;

  @ApiProperty(UserDtoSwagger.ResponseUser.ApiProperty.Status)
  @Expose()
  status: UserStatus;

  @ApiPropertyOptional(
    UserDtoSwagger.ResponseUser.ApiPropertyOptional.CreatedAt,
  )
  @Expose()
  createdAt?: Date;

  @ApiPropertyOptional(
    UserDtoSwagger.ResponseUser.ApiPropertyOptional.UpdatedAt,
  )
  @Expose()
  updatedAt?: Date;
}

export class ResponseFullUserDto extends ResponseUserDto {
  @ApiProperty(UserDtoSwagger.ResponseFullUser.ApiProperty.HasPassword)
  @Expose()
  @Transform(({ obj }: { obj: { password?: string } }) => Boolean(obj.password))
  hasPassword!: boolean;

  @ApiPropertyOptional(UserDtoSwagger.ResponseFullUser.ApiPropertyOptional.Age)
  @Expose()
  age?: number;

  @ApiPropertyOptional(
    UserDtoSwagger.ResponseFullUser.ApiPropertyOptional.Height,
  )
  @Expose()
  height?: number;

  @ApiPropertyOptional(
    UserDtoSwagger.ResponseFullUser.ApiPropertyOptional.Weight,
  )
  @Expose()
  weight?: number;

  @ApiPropertyOptional(
    UserDtoSwagger.ResponseFullUser.ApiPropertyOptional.StripeAccountId,
  )
  @Expose()
  stripeAccountId?: string | null;
}
