import { User } from '../../modules/user/entities/user.entity';
import type { Request } from 'express';

export interface CurrentRequestUser extends Request {
  user: User;
}
