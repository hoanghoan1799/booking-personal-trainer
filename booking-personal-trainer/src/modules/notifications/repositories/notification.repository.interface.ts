import { Notification } from '../entities/notification.entity';
import { NotificationType } from '../enums/notification-type.enum';
import { SortOrder } from '../../../common/enums/pagination/pagination.enum';

/** Injection token for NotificationRepository */
export const NotificationRepositoryToken = Symbol('NotificationRepository');

export type CreateNotificationData = {
  readonly recipientUserId: string;
  readonly type: NotificationType;
  readonly title: string;
  readonly message: string;
  readonly data?: Record<string, unknown> | null;
};

export type NotificationFindManyFilter = {
  readonly recipientUserId: string;
  readonly isRead?: boolean;
};

export type NotificationFindManyOptions = {
  readonly limit: number;
  readonly offset: number;
  readonly orderBy: Record<string, SortOrder>;
};

export interface NotificationRepository {
  create(data: CreateNotificationData): Promise<Notification>;
  findAndCount(
    filter: NotificationFindManyFilter,
    options: NotificationFindManyOptions,
  ): Promise<[Notification[], number]>;
  findByIdForRecipient(args: {
    readonly id: string;
    readonly recipientUserId: string;
  }): Promise<Notification | null>;
  markRead(notification: Notification): Promise<void>;
  markAllReadForRecipient(recipientUserId: string): Promise<number>;
  countUnread(recipientUserId: string): Promise<number>;
}
