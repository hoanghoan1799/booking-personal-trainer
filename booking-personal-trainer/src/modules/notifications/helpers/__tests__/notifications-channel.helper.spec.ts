import { buildUserChannel } from '../notifications-channel.helper';
import { NotificationsConstants } from '../../constants/notifications.constants';

describe('buildUserChannel', () => {
  it('should prefix with channel prefix', () => {
    const actual = buildUserChannel('user-1');

    expect(actual).toBe(`${NotificationsConstants.ChannelPrefix}user-1`);
  });
});
