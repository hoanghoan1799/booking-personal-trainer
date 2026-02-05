import { User } from '../../modules/user/entities/user.entity';

export interface CurrentRequestUser extends Request {
  user: User;
}
