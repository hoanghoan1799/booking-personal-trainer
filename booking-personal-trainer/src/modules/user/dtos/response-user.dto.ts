import { Expose } from 'class-transformer';

// Commons
import {
  TrainerApprovalStatus,
  UserRole,
  UserStatus,
  UserType,
} from '../../../common/enums/user/user.enum';

export class ResponseUserDto {
  @Expose()
  id: string;

  @Expose()
  userName: string;

  @Expose()
  email: string;

  @Expose()
  firstName: string;

  @Expose()
  lastName: string;

  @Expose()
  role: UserRole;

  @Expose()
  userType: UserType;

  @Expose()
  approvalStatus: TrainerApprovalStatus;

  @Expose()
  status: UserStatus;

  @Expose()
  createdAt?: Date;

  @Expose()
  updatedAt?: Date;
}

export class ResponseFullUserDto extends ResponseUserDto {
  @Expose()
  age?: number;

  @Expose()
  height?: number;

  @Expose()
  weight?: number;
}
