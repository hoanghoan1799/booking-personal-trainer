import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from '../notifications.service';

// Commons
import { SortOrder } from '../../../../common/enums/pagination/pagination.enum';
import { UserRole } from '../../../../common/enums/user/user.enum';
import { REDIS_PUBLISHER_TOKEN } from '../../../../common/constants/cache.constant';

// Entities
import { Notification } from '../../entities/notification.entity';

// Enums
import { NotificationType } from '../../enums/notification-type.enum';

// Repositories
import { NotificationRepositoryToken } from '../../repositories/notification.repository.interface';

// Services
import { UserService } from '../../../user/services/user.service';

const RECIPIENT_ID = 'user-1';

type PublisherClientMock = {
  readonly publish: jest.Mock;
};

describe('NotificationsService', () => {
  let service: NotificationsService;
  let notificationRepo: {
    create: jest.Mock;
    findAndCount: jest.Mock;
    findByIdForRecipient: jest.Mock;
    markRead: jest.Mock;
    markAllReadForRecipient: jest.Mock;
    countUnread: jest.Mock;
  };
  let userService: {
    findUsersByRole: jest.Mock;
  };
  let publisherClient: PublisherClientMock;

  beforeEach(async () => {
    notificationRepo = {
      create: jest.fn(),
      findAndCount: jest.fn(),
      findByIdForRecipient: jest.fn(),
      markRead: jest.fn().mockResolvedValue(undefined),
      markAllReadForRecipient: jest.fn(),
      countUnread: jest.fn(),
    };
    userService = {
      findUsersByRole: jest.fn(),
    };
    publisherClient = {
      publish: jest.fn().mockResolvedValue(1),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: NotificationRepositoryToken,
          useValue: notificationRepo,
        },
        {
          provide: UserService,
          useValue: userService,
        },
        {
          provide: REDIS_PUBLISHER_TOKEN,
          useValue: publisherClient,
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  describe('createAndPublishToUsers', () => {
    it('should create notifications and publish to each user channel', async () => {
      const createdOne = {
        id: 'n1',
        type: NotificationType.UserRoleUpdated,
        title: 'Title',
        message: 'Message',
        data: null,
        createdAt: new Date('2030-01-01T00:00:00.000Z'),
      } as Notification;
      const createdTwo = { ...createdOne, id: 'n2' } as Notification;
      notificationRepo.create
        .mockResolvedValueOnce(createdOne)
        .mockResolvedValueOnce(createdTwo);

      const actual = await service.createAndPublishToUsers({
        notifications: [
          {
            recipientUserId: 'u1',
            type: NotificationType.UserRoleUpdated,
            title: 'Title',
            message: 'Message',
            data: null,
          },
          {
            recipientUserId: 'u2',
            type: NotificationType.UserRoleUpdated,
            title: 'Title',
            message: 'Message',
            data: { x: 1 },
          },
        ],
      });

      expect(actual).toEqual([createdOne, createdTwo]);
      expect(notificationRepo.create).toHaveBeenCalledTimes(2);
      expect(publisherClient.publish).toHaveBeenCalledTimes(2);
      expect(publisherClient.publish).toHaveBeenNthCalledWith(
        1,
        'notifications:user:u1',
        expect.any(String),
      );
    });
  });

  describe('notifyAdmins', () => {
    it('should return early when no admins found', async () => {
      userService.findUsersByRole.mockResolvedValue([]);

      await service.notifyAdmins({
        type: NotificationType.AdminNewUserRegistered,
        title: 'T',
        message: 'M',
      });

      expect(notificationRepo.create).not.toHaveBeenCalled();
    });

    it('should create notifications for admins', async () => {
      userService.findUsersByRole.mockResolvedValue([
        { id: 'a1' },
        { id: 'a2' },
      ]);
      const created = { id: 'n1', createdAt: new Date() } as Notification;
      notificationRepo.create.mockResolvedValue(created);

      await service.notifyAdmins({
        type: NotificationType.AdminNewUserRegistered,
        title: 'T',
        message: 'M',
        data: { key: 'value' },
      });

      expect(notificationRepo.create).toHaveBeenCalled();
      expect(userService.findUsersByRole).toHaveBeenCalledWith(
        expect.objectContaining({
          role: UserRole.ADMIN,
        }),
      );
    });
  });

  describe('listForUser', () => {
    it('should apply defaults when page/limit are invalid', async () => {
      notificationRepo.findAndCount.mockResolvedValue([[], 0]);

      const actual = await service.listForUser({
        recipientUserId: RECIPIENT_ID,
        page: 0,
        limit: 0,
      });

      expect(actual.meta).toBeDefined();
      const meta = actual.meta;
      if (!meta) {
        throw new Error('Expected pagination meta to be defined');
      }
      expect(meta.page).toBe(1);
      expect(meta.limit).toBe(20);
      expect(notificationRepo.findAndCount).toHaveBeenCalledWith(
        { recipientUserId: RECIPIENT_ID, isRead: undefined },
        { limit: 20, offset: 0, orderBy: { createdAt: SortOrder.DESC } },
      );
    });

    it('should paginate using provided page and limit', async () => {
      notificationRepo.findAndCount.mockResolvedValue([[], 0]);

      await service.listForUser({
        recipientUserId: RECIPIENT_ID,
        page: 2,
        limit: 5,
        isRead: false,
      });

      expect(notificationRepo.findAndCount).toHaveBeenCalledWith(
        { recipientUserId: RECIPIENT_ID, isRead: false },
        { limit: 5, offset: 5, orderBy: { createdAt: SortOrder.DESC } },
      );
    });
  });

  describe('getUnreadCountForUser', () => {
    it('should return unread count', async () => {
      notificationRepo.countUnread.mockResolvedValue(3);

      const actual = await service.getUnreadCountForUser({
        recipientUserId: RECIPIENT_ID,
      });

      expect(actual.data).toEqual({ unreadCount: 3 });
    });
  });

  describe('markReadForUser', () => {
    it('should return ok when notification not found', async () => {
      notificationRepo.findByIdForRecipient.mockResolvedValue(null);

      const actual = await service.markReadForUser({
        id: 'missing',
        recipientUserId: RECIPIENT_ID,
      });

      expect(actual.data).toEqual({ id: 'missing', isRead: true });
      expect(notificationRepo.markRead).not.toHaveBeenCalled();
    });

    it('should mark read when found', async () => {
      const notification = { id: 'n1' } as Notification;
      notificationRepo.findByIdForRecipient.mockResolvedValue(notification);

      const actual = await service.markReadForUser({
        id: 'n1',
        recipientUserId: RECIPIENT_ID,
      });

      expect(actual.data).toEqual({ id: 'n1', isRead: true });
      expect(notificationRepo.markRead).toHaveBeenCalledWith(notification);
    });
  });

  describe('markAllReadForUser', () => {
    it('should mark all read and return updated count', async () => {
      notificationRepo.markAllReadForRecipient.mockResolvedValue(7);

      const actual = await service.markAllReadForUser({
        recipientUserId: RECIPIENT_ID,
      });

      expect(actual.data).toEqual({ updated: 7 });
    });
  });
});
