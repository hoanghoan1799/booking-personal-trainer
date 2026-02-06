import {
  TrainerApprovalStatus,
  UserRole,
  UserStatus,
  UserType,
} from '../../../common/enums/user/user.enum';

export class ResponseUserDto {
  id?: string;
  userName: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  userType: UserType;
  approvalStatus: TrainerApprovalStatus;
  status: UserStatus;
}
