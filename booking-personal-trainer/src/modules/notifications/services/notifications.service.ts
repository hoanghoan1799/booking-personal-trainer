import { Inject, Injectable } from '@nestjs/common';
import type { RedisClientType } from 'redis';

// Commons
import { BaseResponseDto } from '../../../common/dtos/base-response.dto';
import { utcNowAsDate } from '../../../common/utils/date-time/utc-date-time.helper';
import { SortOrder } from '../../../common/enums/pagination/pagination.enum';
import { UserRole } from '../../../common/enums/user/user.enum';
import { REDIS_PUBLISHER_TOKEN } from '../../../common/constants/cache.constant';

import { NotificationsConstants } from '../constants/notifications.constants';
import { buildUserChannel } from '../helpers/notifications-channel.helper';

// Repositories
import {
  NotificationRepositoryToken,
  type NotificationRepository,
} from '../repositories/notification.repository.interface';
import {
  UserRepositoryToken,
  type UserRepository,
} from '../../user/repositories/user.repository.interface';

// Entities
import { Notification } from '../entities/notification.entity';

// Enums
import { NotificationType } from '../enums/notification-type.enum';

type PublishNotificationPayload = {
  readonly notificationId: string;
  readonly type: NotificationType;
  readonly title: string;
  readonly message: string;
  readonly data: Record<string, unknown> | null;
  readonly createdAt: string;
};

type CreateNotificationInput = {
  readonly recipientUserId: string;
  readonly type: NotificationType;
  readonly title: string;
  readonly message: string;
  readonly data?: Record<string, unknown> | null;
};

@Injectable()
export class NotificationsService {
  constructor(
    @Inject(NotificationRepositoryToken)
    private readonly notificationRepo: NotificationRepository,
    @Inject(UserRepositoryToken)
    private readonly userRepo: UserRepository,
    @Inject(REDIS_PUBLISHER_TOKEN)
    private readonly publisherClient: RedisClientType,
  ) {}

  public async createAndPublishToUsers(input: {
    readonly notifications: CreateNotificationInput[];
  }): Promise<Notification[]> {
    const created: Notification[] = [];
    for (const item of input.notifications) {
      const notification = await this.notificationRepo.create({
        recipientUserId: item.recipientUserId,
        type: item.type,
        title: item.title,
        message: item.message,
        data: item.data ?? null,
      });
      created.push(notification);
      await this.publishToUser({
        recipientUserId: item.recipientUserId,
        notification,
      });
    }
    return created;
  }

  public async notifyAdmins(input: {
    readonly type: NotificationType;
    readonly title: string;
    readonly message: string;
    readonly data?: Record<string, unknown> | null;
  }): Promise<void> {
    const [admins] = await this.userRepo.findAndCount(
      { role: UserRole.ADMIN },
      {
        limit: NotificationsConstants.AdminsQuery.Limit,
        offset: NotificationsConstants.AdminsQuery.Offset,
        orderBy: { createdAt: SortOrder.DESC },
      },
    );
    if (!admins || admins.length === 0) {
      return;
    }
    await this.createAndPublishToUsers({
      notifications: admins.map((admin) => ({
        recipientUserId: admin.id,
        type: input.type,
        title: input.title,
        message: input.message,
        data: input.data ?? null,
      })),
    });
  }

  public async listForUser(input: {
    readonly recipientUserId: string;
    readonly page: number;
    readonly limit: number;
    readonly isRead?: boolean;
  }): Promise<BaseResponseDto<Notification[]>> {
    const page =
      input.page > 0
        ? input.page
        : NotificationsConstants.ListForUser.DefaultPage;
    const limit =
      input.limit > 0
        ? input.limit
        : NotificationsConstants.ListForUser.DefaultLimit;
    const offset = (page - 1) * limit;
    const [notifications, totalItems] =
      await this.notificationRepo.findAndCount(
        {
          recipientUserId: input.recipientUserId,
          isRead: input.isRead,
        },
        { limit, offset, orderBy: { createdAt: SortOrder.DESC } },
      );
    return BaseResponseDto.okWithPagination(notifications, {
      totalItems,
      page,
      limit,
    });
  }

  public async getUnreadCountForUser(input: {
    readonly recipientUserId: string;
  }): Promise<BaseResponseDto<{ unreadCount: number }>> {
    const unreadCount = await this.notificationRepo.countUnread(
      input.recipientUserId,
    );
    return BaseResponseDto.ok({ unreadCount });
  }

  public async markReadForUser(input: {
    readonly id: string;
    readonly recipientUserId: string;
  }): Promise<BaseResponseDto<{ id: string; isRead: true }>> {
    const notification = await this.notificationRepo.findByIdForRecipient({
      id: input.id,
      recipientUserId: input.recipientUserId,
    });
    if (!notification) {
      return BaseResponseDto.ok({ id: input.id, isRead: true });
    }
    await this.notificationRepo.markRead(notification);
    return BaseResponseDto.ok({ id: input.id, isRead: true });
  }

  public async markAllReadForUser(input: {
    readonly recipientUserId: string;
  }): Promise<BaseResponseDto<{ updated: number }>> {
    const updated = await this.notificationRepo.markAllReadForRecipient(
      input.recipientUserId,
    );
    return BaseResponseDto.ok({ updated });
  }

  private async publishToUser(input: {
    readonly recipientUserId: string;
    readonly notification: Notification;
  }): Promise<void> {
    const payload: PublishNotificationPayload = {
      notificationId: input.notification.id,
      type: input.notification.type,
      title: input.notification.title,
      message: input.notification.message,
      data: (input.notification.data as Record<string, unknown> | null) ?? null,
      createdAt: (input.notification.createdAt ?? utcNowAsDate()).toISOString(),
    };
    const channel = buildUserChannel(input.recipientUserId);
    await this.publisherClient.publish(channel, JSON.stringify(payload));
  }
}
