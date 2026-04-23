import { NotificationsConstants } from '../constants/notifications.constants';

export const buildUserChannel = (userId: string): string =>
  `${NotificationsConstants.ChannelPrefix}${userId}`;
