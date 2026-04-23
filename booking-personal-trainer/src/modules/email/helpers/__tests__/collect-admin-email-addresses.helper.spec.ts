import { collectAdminEmailAddresses } from '../collect-admin-email-addresses.helper';
import { UserRole } from '../../../../common/enums/user/user.enum';
import { SortOrder } from '../../../../common/enums/pagination/pagination.enum';

describe('collectAdminEmailAddresses', () => {
  it('should return [] when repository returns empty list', async () => {
    const userRepo = {
      findAndCount: jest.fn().mockResolvedValue([[], 0]),
    };

    const actual = await collectAdminEmailAddresses(
      userRepo as unknown as Parameters<typeof collectAdminEmailAddresses>[0],
    );

    expect(actual).toEqual([]);
    expect(userRepo.findAndCount).toHaveBeenCalledWith(
      { role: UserRole.ADMIN },
      {
        limit: 500,
        offset: 0,
        orderBy: { createdAt: SortOrder.DESC },
      },
    );
  });

  it('should trim and filter empty emails', async () => {
    const userRepo = {
      findAndCount: jest
        .fn()
        .mockResolvedValue([
          [
            { email: ' a@test.com ' },
            { email: '   ' },
            { email: 'b@test.com' },
          ],
          3,
        ]),
    };

    const actual = await collectAdminEmailAddresses(
      userRepo as unknown as Parameters<typeof collectAdminEmailAddresses>[0],
    );

    expect(actual).toEqual(['a@test.com', 'b@test.com']);
  });
});
