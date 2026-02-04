import { SetMetadata } from '@nestjs/common';

// Enums
import { UserRole } from '../enums/user/user.enum';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
