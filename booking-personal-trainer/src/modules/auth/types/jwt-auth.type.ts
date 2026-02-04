import { UserRole } from '../../../common/enums/user/user.enum';

export interface JwtAuthPayload {
  id: string;
  email: string;
  userName: string;
  role: UserRole;
}
