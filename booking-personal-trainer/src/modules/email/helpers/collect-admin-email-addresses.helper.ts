import { SortOrder } from '../../../common/enums/pagination/pagination.enum';
import { UserRole } from '../../../common/enums/user/user.enum';
import type { UserRepository } from '../../user/repositories/user.repository.interface';

/**
 * Returns email addresses for users with the ADMIN role (same cap as in-app admin notifications).
 */
export const collectAdminEmailAddresses = async (
  userRepo: UserRepository,
): Promise<readonly string[]> => {
  const [admins] = await userRepo.findAndCount(
    { role: UserRole.ADMIN },
    {
      limit: 500,
      offset: 0,
      orderBy: { createdAt: SortOrder.DESC },
    },
  );
  if (!admins || admins.length === 0) {
    return [];
  }
  return admins
    .map((admin) => admin.email.trim())
    .filter((email) => email !== '');
};
