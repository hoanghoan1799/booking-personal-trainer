import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

// Commons
import { ERROR_MESSAGES } from '../../../../common/constants/message.constant';
import {
  TrainerApprovalStatus,
  UserRole,
  UserStatus,
  UserType,
} from '../../../../common/enums/user/user.enum';
import { SortOrder } from '../../../../common/enums/pagination/pagination.enum';

// Types
import type { JwtAuthPayload } from '../../../auth/types/jwt-auth.type';

// Entities
import { User } from '../../entities/user.entity';

// Services
import { UserService } from '../user.service';

// Repositories
import { UserRepositoryToken } from '../../repositories/user.repository.interface';
import { UserProviderRepositoryToken } from '../../repositories/user-provider.repository.interface';
import { BookingService } from '../../../booking/services/booking.service';
import { NotificationsService } from '../../../notifications/services/notifications.service';
import { EmailService } from '../../../email/services/email.service';

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
    findByEmail: jest.Mock;
    findByUserName: jest.Mock;
    findByEmailOrUserName: jest.Mock;
    findAndCount: jest.Mock;
    save: jest.Mock;
  };
  let userProviderRepo: {
    findByProviderIdentity: jest.Mock;
    create: jest.Mock;
  };
  let bookingService: { findTraineeIdsByTrainerId: jest.Mock };
  let notificationsService: {
    createAndPublishToUsers: jest.Mock;
    notifyAdmins: jest.Mock;
  };
  let emailService: { send: jest.Mock };

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
      findByEmail: jest.fn(),
      findByUserName: jest.fn(),
      findByEmailOrUserName: jest.fn(),
      findAndCount: jest.fn(),
      save: jest.fn().mockResolvedValue(undefined),
    };
    userProviderRepo = {
      findByProviderIdentity: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({}),
    };
    bookingService = {
      findTraineeIdsByTrainerId: jest.fn().mockResolvedValue([]),
    };
    notificationsService = {
      createAndPublishToUsers: jest.fn().mockResolvedValue([]),
      notifyAdmins: jest.fn().mockResolvedValue(undefined),
    };
    emailService = {
      send: jest.fn().mockResolvedValue({ messageId: 'mock-message-id' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: UserRepositoryToken,
          useValue: userRepo,
        },
        {
          provide: UserProviderRepositoryToken,
          useValue: userProviderRepo,
        },
        {
          provide: BookingService,
          useValue: bookingService,
        },
        {
          provide: NotificationsService,
          useValue: notificationsService,
        },
        {
          provide: EmailService,
          useValue: emailService,
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

  describe('findByIdOrNull', () => {
    it('should return user when found', async () => {
      userRepo.findById.mockResolvedValue(mockUser);
      const actual = await service.findByIdOrNull(mockUser.id);
      expect(actual).toBe(mockUser);
    });

    it('should return null when not found', async () => {
      userRepo.findById.mockResolvedValue(null);
      const actual = await service.findByIdOrNull('missing');
      expect(actual).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should return user when found', async () => {
      userRepo.findByEmail.mockResolvedValue(mockUser);
      const actual = await service.findByEmail(mockUser.email);
      expect(actual).toBe(mockUser);
    });
  });

  describe('findByUserName', () => {
    it('should return user when found', async () => {
      userRepo.findByUserName.mockResolvedValue(mockUser);
      const actual = await service.findByUserName(mockUser.userName);
      expect(actual).toBe(mockUser);
    });
  });

  describe('findUsersByRole', () => {
    it('should return empty array when repo returns null list', async () => {
      userRepo.findAndCount.mockResolvedValue([null, 0]);

      const actual = await service.findUsersByRole({
        role: UserRole.ADMIN,
        limit: 10,
        offset: 0,
      });

      expect(actual).toEqual([]);
    });

    it('should return users for role', async () => {
      userRepo.findAndCount.mockResolvedValue([[mockUser], 1]);

      const actual = await service.findUsersByRole({
        role: UserRole.TRAINEE,
        limit: 10,
        offset: 0,
      });

      expect(userRepo.findAndCount).toHaveBeenCalledWith(
        { role: UserRole.TRAINEE },
        expect.objectContaining({
          limit: 10,
          offset: 0,
          orderBy: { createdAt: SortOrder.DESC },
        }),
      );
      expect(actual).toEqual([mockUser]);
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

    it('should set filter to trainees for trainer role by default and scope by booking traineeIds', async () => {
      const currentUser: JwtAuthPayload = {
        id: 'trainer-id',
        email: 'trainer@test.com',
        userName: 'trainer',
        role: UserRole.TRAINER,
      };
      bookingService.findTraineeIdsByTrainerId.mockResolvedValue(['t1', 't2']);
      userRepo.findAndCount.mockResolvedValue([[], 0]);

      await service.getAll({ page: 1, limit: 10 }, currentUser);

      expect(userRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          role: UserRole.TRAINEE,
          onlyTraineeIds: ['t1', 't2'],
        }),
        expect.any(Object),
      );
    });

    it('should allow trainer to discover other approved trainers when query role=TRAINER and approvalStatus=APPROVED', async () => {
      const currentUser: JwtAuthPayload = {
        id: 'trainer-id',
        email: 'trainer@test.com',
        userName: 'trainer',
        role: UserRole.TRAINER,
      };
      userRepo.findAndCount.mockResolvedValue([[], 0]);

      await service.getAll(
        {
          page: 1,
          limit: 10,
          role: UserRole.TRAINER,
          approvalStatus: TrainerApprovalStatus.APPROVED,
        },
        currentUser,
      );

      expect(userRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          role: UserRole.TRAINER,
          approvalStatus: TrainerApprovalStatus.APPROVED,
          excludeUserId: 'trainer-id',
        }),
        expect.any(Object),
      );
    });

    it('should apply admin filters when current user is ADMIN', async () => {
      const currentUser: JwtAuthPayload = {
        id: 'admin-id',
        email: 'admin@test.com',
        userName: 'admin',
        role: UserRole.ADMIN,
      };
      userRepo.findAndCount.mockResolvedValue([[], 0]);

      await service.getAll(
        {
          page: 1,
          limit: 10,
          userType: UserType.TRAINER,
          role: UserRole.TRAINER,
          approvalStatus: TrainerApprovalStatus.APPROVED,
          search: 'john',
        },
        currentUser,
      );

      expect(userRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          userType: UserType.TRAINER,
          role: UserRole.TRAINER,
          approvalStatus: TrainerApprovalStatus.APPROVED,
          search: 'john',
        }),
        expect.any(Object),
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

    it('should set APPROVED when promoting TRAINEE userType to TRAINER role', async () => {
      const targetUser = {
        ...mockUser,
        id: 'trainee-type-id',
        userType: UserType.TRAINEE,
        role: UserRole.TRAINEE,
        approvalStatus: TrainerApprovalStatus.NONE,
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

    it('should set APPROVED when role is already TRAINER but approvalStatus was NONE', async () => {
      const targetUser = {
        ...mockUser,
        id: 'stuck-trainer-id',
        userType: UserType.TRAINEE,
        role: UserRole.TRAINER,
        approvalStatus: TrainerApprovalStatus.NONE,
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

    it('should throw ForbiddenException when target user is admin', async () => {
      const targetUser = { ...mockUser, role: UserRole.ADMIN };
      userRepo.findById.mockResolvedValue(targetUser);
      const currentUser: JwtAuthPayload = {
        id: 'admin-id',
        email: 'admin@test.com',
        userName: 'admin',
        role: UserRole.ADMIN,
      };

      await expect(
        service.updateUserRole(
          'target-id',
          { role: UserRole.TRAINER },
          currentUser,
        ),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.updateUserRole(
          'target-id',
          { role: UserRole.TRAINER },
          currentUser,
        ),
      ).rejects.toThrow(ERROR_MESSAGES.USER.ADMIN_UPDATE);
    });

    it('should return early when role and approval status do not change', async () => {
      const targetUser = {
        ...mockUser,
        id: 'target-id',
        userType: UserType.TRAINEE,
        role: UserRole.TRAINEE,
        approvalStatus: TrainerApprovalStatus.NONE,
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
        { role: UserRole.TRAINEE },
        currentUser,
      );

      expect(actual.data.role).toBe(UserRole.TRAINEE);
      expect(userRepo.save).not.toHaveBeenCalled();
      expect(
        notificationsService.createAndPublishToUsers,
      ).not.toHaveBeenCalled();
      expect(emailService.send).not.toHaveBeenCalled();
    });
  });

  describe('requestTrainerRole', () => {
    const traineePayload: JwtAuthPayload = {
      id: mockUser.id,
      email: mockUser.email,
      userName: mockUser.userName,
      role: UserRole.TRAINEE,
    };

    it('should set userType TRAINER and approval PENDING for trainee account', async () => {
      const user = {
        ...mockUser,
        userType: UserType.TRAINEE,
        approvalStatus: TrainerApprovalStatus.NONE,
      };
      userRepo.findById.mockResolvedValue(user);

      const actual = await service.requestTrainerRole(traineePayload);

      expect(actual.data.userType).toBe(UserType.TRAINER);
      expect(actual.data.approvalStatus).toBe(TrainerApprovalStatus.PENDING);
      expect(userRepo.save).toHaveBeenCalled();
      expect(notificationsService.notifyAdmins).toHaveBeenCalled();
    });

    it('should throw ConflictException when application already pending', async () => {
      const user = {
        ...mockUser,
        userType: UserType.TRAINER,
        role: UserRole.TRAINEE,
        approvalStatus: TrainerApprovalStatus.PENDING,
      };
      userRepo.findById.mockResolvedValue(user);

      await expect(service.requestTrainerRole(traineePayload)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.requestTrainerRole(traineePayload)).rejects.toThrow(
        ERROR_MESSAGES.USER.TRAINER_APPLICATION_ALREADY_PENDING,
      );
      expect(userRepo.save).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when already approved', async () => {
      const user = {
        ...mockUser,
        userType: UserType.TRAINER,
        role: UserRole.TRAINEE,
        approvalStatus: TrainerApprovalStatus.APPROVED,
      };
      userRepo.findById.mockResolvedValue(user);

      await expect(service.requestTrainerRole(traineePayload)).rejects.toThrow(
        ERROR_MESSAGES.USER.TRAINER_APPLICATION_ALREADY_APPROVED,
      );
    });

    it('should throw ForbiddenException when role is not trainee', async () => {
      const user = {
        ...mockUser,
        role: UserRole.TRAINER,
        userType: UserType.TRAINER,
        approvalStatus: TrainerApprovalStatus.APPROVED,
      };
      userRepo.findById.mockResolvedValue(user);

      await expect(service.requestTrainerRole(traineePayload)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should reset REJECTED to PENDING for trainer userType', async () => {
      const user = {
        ...mockUser,
        userType: UserType.TRAINER,
        role: UserRole.TRAINEE,
        approvalStatus: TrainerApprovalStatus.REJECTED,
      };
      userRepo.findById.mockResolvedValue(user);

      const actual = await service.requestTrainerRole(traineePayload);

      expect(actual.data.approvalStatus).toBe(TrainerApprovalStatus.PENDING);
      expect(userRepo.save).toHaveBeenCalled();
      expect(notificationsService.notifyAdmins).toHaveBeenCalled();
    });

    it('should set PENDING when trainer userType has NONE approval', async () => {
      const user = {
        ...mockUser,
        userType: UserType.TRAINER,
        role: UserRole.TRAINEE,
        approvalStatus: TrainerApprovalStatus.NONE,
      };
      userRepo.findById.mockResolvedValue(user);

      const actual = await service.requestTrainerRole(traineePayload);

      expect(actual.data.approvalStatus).toBe(TrainerApprovalStatus.PENDING);
      expect(userRepo.save).toHaveBeenCalled();
    });

    it('should throw ConflictException for unsupported trainee approval state', async () => {
      const user = {
        ...mockUser,
        userType: UserType.TRAINEE,
        role: UserRole.TRAINEE,
        approvalStatus: TrainerApprovalStatus.PENDING,
      };
      userRepo.findById.mockResolvedValue(user);

      await expect(service.requestTrainerRole(traineePayload)).rejects.toThrow(
        ERROR_MESSAGES.USER.TRAINER_APPLICATION_INVALID_STATE,
      );
    });

    it('should return success when notifyAdmins fails', async () => {
      const user = {
        ...mockUser,
        userType: UserType.TRAINEE,
        approvalStatus: TrainerApprovalStatus.NONE,
      };
      userRepo.findById.mockResolvedValue(user);
      notificationsService.notifyAdmins.mockRejectedValue(
        new Error('notify failed'),
      );

      const actual = await service.requestTrainerRole(traineePayload);

      expect(actual.data.approvalStatus).toBe(TrainerApprovalStatus.PENDING);
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

  describe('ensureLocalUserProviderForUser', () => {
    it('should return early when local provider exists', async () => {
      userProviderRepo.findByProviderIdentity.mockResolvedValue({
        id: 'p1',
      });

      await service.ensureLocalUserProviderForUser({
        id: 'u1',
        email: 'User@Test.com',
      } as User);

      expect(userProviderRepo.create).not.toHaveBeenCalled();
    });

    it('should create local provider when missing', async () => {
      userProviderRepo.findByProviderIdentity.mockResolvedValue(null);
      userProviderRepo.create.mockResolvedValue({ id: 'p1' });

      await service.ensureLocalUserProviderForUser({
        id: 'u1',
        email: 'User@Test.com',
      } as User);

      expect(userProviderRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'u1',
          providerUserId: 'user@test.com',
        }),
      );
    });
  });

  describe('pickUniqueUserNameFromEmail', () => {
    it('should return base username when available', async () => {
      userRepo.findByUserName.mockResolvedValue(null);
      const actual =
        await service.pickUniqueUserNameFromEmail('john.doe@test.com');
      expect(actual).toBe('john_doe');
    });

    it('should append suffix when base is taken', async () => {
      userRepo.findByUserName
        .mockResolvedValueOnce({ id: 'u1' })
        .mockResolvedValueOnce(null);

      const actual = await service.pickUniqueUserNameFromEmail('john@test.com');

      expect(actual).toBe('john_1');
    });

    it('should throw ConflictException when too many attempts', async () => {
      userRepo.findByUserName.mockResolvedValue({ id: 'u1' });

      await expect(
        service.pickUniqueUserNameFromEmail('john@test.com'),
      ).rejects.toThrow(ConflictException);
      await expect(
        service.pickUniqueUserNameFromEmail('john@test.com'),
      ).rejects.toThrow(ERROR_MESSAGES.USER.USERNAME_TAKEN);
    });
  });
});
