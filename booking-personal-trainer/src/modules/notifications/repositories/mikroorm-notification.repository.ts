import { Injectable } from '@nestjs/common';
import { EntityManager, EntityRepository, FilterQuery } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';

// Commons
import { SortOrder } from '../../../common/enums/pagination/pagination.enum';

// Entities
import { Notification } from '../entities/notification.entity';
import { User } from '../../user/entities/user.entity';

// Repositories
import type {
  CreateNotificationData,
  NotificationFindManyFilter,
  NotificationFindManyOptions,
  NotificationRepository,
} from './notification.repository.interface';

@Injectable()
export class MikroOrmNotificationRepository implements NotificationRepository {
  constructor(
    @InjectRepository(Notification)
    private readonly repo: EntityRepository<Notification>,
    private readonly em: EntityManager,
  ) {}

  async create(data: CreateNotificationData): Promise<Notification> {
    const notification = this.repo.create({
      recipient: this.em.getReference(User, data.recipientUserId),
      type: data.type,
      title: data.title,
      message: data.message,
      data: data.data ?? null,
      isRead: false,
    });
    await this.em.persist(notification).flush();
    return notification;
  }

  async findAndCount(
    filter: NotificationFindManyFilter,
    options: NotificationFindManyOptions,
  ): Promise<[Notification[], number]> {
    const where: FilterQuery<Notification> = {
      recipient: filter.recipientUserId,
    };
    if (filter.isRead != null) {
      where.isRead = filter.isRead;
    }
    const orderBy =
      options.orderBy && Object.keys(options.orderBy).length > 0
        ? (options.orderBy as Record<string, 'ASC' | 'DESC'>)
        : { createdAt: SortOrder.DESC };
    return this.repo.findAndCount(where, {
      populate: ['recipient'],
      limit: options.limit,
      offset: options.offset,
      orderBy,
    });
  }

  async findByIdForRecipient(args: {
    readonly id: string;
    readonly recipientUserId: string;
  }): Promise<Notification | null> {
    return this.repo.findOne({
      id: args.id,
      recipient: args.recipientUserId,
    });
  }

  async markRead(notification: Notification): Promise<void> {
    if (notification.isRead) {
      return;
    }
    notification.isRead = true;
    await this.em.persist(notification).flush();
  }

  async markAllReadForRecipient(recipientUserId: string): Promise<number> {
    const result = await this.em.nativeUpdate(
      Notification,
      { recipient: recipientUserId, isRead: false },
      { isRead: true },
    );
    return result;
  }

  async countUnread(recipientUserId: string): Promise<number> {
    return this.repo.count({ recipient: recipientUserId, isRead: false });
  }
}
