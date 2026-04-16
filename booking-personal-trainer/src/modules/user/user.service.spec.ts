import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

// Commons
import { ERROR_MESSAGES } from '../../common/constants/message.constant';
import {
  TrainerApprovalStatus,
  UserRole,
  UserStatus,
  UserType,
} from '../../common/enums/user/user.enum';
import { SortOrder } from '../../common/enums/pagination/pagination.enum';

// Types
import type { JwtAuthPayload } from '../auth/types/jwt-auth.type';

// Entities
import { User } from './entities/user.entity';

// Services
import { UserService } from './user.service';

// Repositories
import { UserRepositoryToken } from './repositories/user.repository.interface';
import { BookingRepositoryToken } from '../booking/repositories/booking.repository.interface';
import { NotificationsService } from '../notifications/notifications.service';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT_TRAINEES = 20;
const DEFAULT_LIMIT = 10;
const TOTAL_ITEMS_ONE = 1;
const EMPTY_LIST_LENGTH = 0;

describe('UserService', () => {
  let service: UserService;
  let userRepo: {
    create: jest.Mock;
    findById: jest.Mock;
    findByEmailOrUserName: jest.Mock;
    findAndCount: jest.Mock;
    save: jest.Mock;
  };
  let bookingRepo: { findTraineeIdsByTrainerId: jest.Mock };
  let notificationsService: { createAndPublishToUsers: jest.Mock };

  const mockUser = {
    id: 'user-uuid',
    email: 'user@test.com',
    userName: 'testuser',
    role: UserRole.TRAINEE,
    userType: UserType.TRAINEE,
    approvalStatus: TrainerApprovalStatus.NONE,
  } as User;

  beforeEach(async () => {
    userRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      findByEmailOrUserName: jest.fn(),
      findAndCount: jest.fn(),
      save: jest.fn().mockResolvedValue(undefined),
    };
    bookingRepo = {
      findTraineeIdsByTrainerId: jest.fn().mockResolvedValue([]),
    };
    notificationsService = {
      createAndPublishToUsers: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: UserRepositoryToken,
          useValue: userRepo,
        },
        {
          provide: BookingRepositoryToken,
          useValue: bookingRepo,
        },
        {
          provide: NotificationsService,
          useValue: notificationsService,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  describe('create', () => {
    it('should create and persist a new user', async () => {
      const data = {
        email: 'new@test.com',
        password: 'hashed',
        userName: 'newuser',
        firstName: 'New',
        lastName: 'User',
        userType: UserType.TRAINEE,
        role: UserRole.TRAINEE,
        approvalStatus: TrainerApprovalStatus.NONE,
        status: UserStatus.ACTIVE,
      };
      const createdUser = { ...mockUser, ...data };
      userRepo.create.mockResolvedValue(createdUser);

      const actual = await service.create(data);

      expect(actual).toEqual(createdUser);
      expect(userRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: data.email,
          userName: data.userName,
        }),
      );
    });
  });

  describe('findByEmailOrUserName', () => {
    it('should return user when found by email', async () => {
      userRepo.findByEmailOrUserName.mockResolvedValue(mockUser);

      const actual = await service.findByEmailOrUserName('user@test.com');

      expect(actual).toEqual(mockUser);
      expect(userRepo.findByEmailOrUserName).toHaveBeenCalledWith(
        'user@test.com',
        undefined,
      );
    });

    it('should return null when not found', async () => {
      userRepo.findByEmailOrUserName.mockResolvedValue(null);

      const actual = await service.findByEmailOrUserName('nobody@test.com');

      expect(actual).toBeNull();
    });
  });

  describe('findById', () => {
    it('should return user when found', async () => {
      userRepo.findById.mockResolvedValue(mockUser);

      const actual = await service.findById(mockUser.id);

      expect(actual).toEqual(mockUser);
    });

    it('should throw NotFoundException when not found', async () => {
      userRepo.findById.mockResolvedValue(null);

      await expect(service.findById('missing-id')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findById('missing-id')).rejects.toThrow(
        ERROR_MESSAGES.USER.NOT_FOUND,
      );
    });
  });

  describe('getAll', () => {
    it('should filter by TRAINER and APPROVED when current user is TRAINEE', async () => {
      const currentUser: JwtAuthPayload = {
        id: 'trainee-id',
        email: 'trainee@test.com',
        userName: 'trainee',
        role: UserRole.TRAINEE,
      };
      const query = {
        page: DEFAULT_PAGE,
        limit: DEFAULT_LIMIT_TRAINEES,
        order: SortOrder.DESC,
      };
      userRepo.findAndCount.mockResolvedValue([[], EMPTY_LIST_LENGTH]);

      await service.getAll(query, currentUser);

      expect(userRepo.findAndCount).toHaveBeenCalledWith(
        {
          role: UserRole.TRAINER,
          approvalStatus: TrainerApprovalStatus.APPROVED,
        },
        expect.any(Object),
      );
    });

    it('should return paginated result', async () => {
      const currentUser: JwtAuthPayload = {
        id: 'admin-id',
        email: 'admin@test.com',
        userName: 'admin',
        role: UserRole.ADMIN,
      };
      const query = {
        page: DEFAULT_PAGE,
        limit: DEFAULT_LIMIT,
        order: SortOrder.DESC,
      };
      const users = [mockUser];
      userRepo.findAndCount.mockResolvedValue([users, TOTAL_ITEMS_ONE]);

      const actual = await service.getAll(query, currentUser);

      expect(actual.data).toEqual(users);
      expect(actual.meta).toEqual(
        expect.objectContaining({
          page: DEFAULT_PAGE,
          limit: DEFAULT_LIMIT,
          totalItems: TOTAL_ITEMS_ONE,
        }),
      );
    });
  });

  describe('updateUserRole', () => {
    it('should throw ForbiddenException when updating own role', async () => {
      const currentUser: JwtAuthPayload = {
        id: mockUser.id,
        email: mockUser.email,
        userName: mockUser.userName,
        role: UserRole.ADMIN,
      };

      await expect(
        service.updateUserRole(
          mockUser.id,
          { role: UserRole.TRAINER },
          currentUser,
        ),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.updateUserRole(
          mockUser.id,
          { role: UserRole.TRAINER },
          currentUser,
        ),
      ).rejects.toThrow(ERROR_MESSAGES.USER.CANNOT_UPDATE_SELF_ROLE);
    });

    it('should throw ForbiddenException when assigning ADMIN role', async () => {
      const currentUser: JwtAuthPayload = {
        id: 'admin-id',
        email: 'admin@test.com',
        userName: 'admin',
        role: UserRole.ADMIN,
      };

      await expect(
        service.updateUserRole(
          mockUser.id,
          { role: UserRole.ADMIN },
          currentUser,
        ),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.updateUserRole(
          mockUser.id,
          { role: UserRole.ADMIN },
          currentUser,
        ),
      ).rejects.toThrow(ERROR_MESSAGES.USER.CANNOT_ASSIGN_ADMIN);
    });

    it('should throw NotFoundException when target user not found', async () => {
      userRepo.findById.mockResolvedValue(null);
      const currentUser: JwtAuthPayload = {
        id: 'admin-id',
        email: 'admin@test.com',
        userName: 'admin',
        role: UserRole.ADMIN,
      };

      await expect(
        service.updateUserRole(
          'missing-id',
          { role: UserRole.TRAINER },
          currentUser,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should update role and return user when valid', async () => {
      const targetUser = {
        ...mockUser,
        id: 'target-id',
        userType: UserType.TRAINER,
        role: UserRole.TRAINEE,
        approvalStatus: TrainerApprovalStatus.PENDING,
      };
      userRepo.findById.mockResolvedValue(targetUser);
      const currentUser: JwtAuthPayload = {
        id: 'admin-id',
        email: 'admin@test.com',
        userName: 'admin',
        role: UserRole.ADMIN,
      };

      const actual = await service.updateUserRole(
        targetUser.id,
        { role: UserRole.TRAINER },
        currentUser,
      );

      expect(actual.data.role).toBe(UserRole.TRAINER);
      expect(actual.data.approvalStatus).toBe(TrainerApprovalStatus.APPROVED);
      expect(userRepo.save).toHaveBeenCalled();
    });
  });

  describe('updateProfile', () => {
    it('should throw NotFoundException when user not found', async () => {
      userRepo.findById.mockResolvedValue(null);
      const currentUser: JwtAuthPayload = {
        id: 'missing-id',
        email: 'missing@test.com',
        userName: 'missing',
        role: UserRole.TRAINEE,
      };

      await expect(
        service.updateProfile({ age: 25 }, currentUser),
      ).rejects.toThrow(NotFoundException);
    });

    it('should update and return user when found', async () => {
      const user = { ...mockUser, age: 20 };
      userRepo.findById.mockResolvedValue(user);
      const currentUser: JwtAuthPayload = {
        id: user.id,
        email: user.email,
        userName: user.userName,
        role: UserRole.TRAINEE,
      };

      const actual = await service.updateProfile({ age: 30 }, currentUser);

      expect(actual.data.age).toBe(30);
      expect(userRepo.save).toHaveBeenCalled();
    });
  });
});
