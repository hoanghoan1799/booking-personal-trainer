import {
  ConflictException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';

// Commons
import { ERROR_MESSAGES } from '../../../common/constants/message.constant';
import {
  TrainerApprovalStatus,
  UserRole,
  UserType,
} from '../../../common/enums/user/user.enum';
import {
  SortBy,
  SortOrder,
} from '../../../common/enums/pagination/pagination.enum';
import {
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
} from '../../../common/constants/pagination.constant';

// Types
import type { JwtAuthPayload } from '../../auth/types/jwt-auth.type';
import { NotificationsService } from '../../notifications/services/notifications.service';
import { NotificationType } from '../../notifications/enums/notification-type.enum';
import { NotificationTemplates } from '../../notifications/constants/notification-template.constant';
import { EmailService } from '../../email/services/email.service';
import { EmailTemplates } from '../../email/constants/email-template.constant';

// Entities
import { User } from '../entities/user.entity';
import { UserProvider } from '../entities/user-provider.entity';

// DTOs
import {
  UpdateUserProfileDto,
  UpdateUserRoleDto,
} from '../dtos/update-user.dto';
import { GetUsersQueryDto } from '../dtos/get-user.dto';
import { BaseResponseDto } from '../../../common/dtos/base-response.dto';
import {
  ResponseFullUserDto,
  ResponseUserDto,
} from '../dtos/response-user.dto';

// Repositories
import {
  UserRepositoryToken,
  type UserRepository,
  type UserFindManyFilter,
  type CreateUserData,
} from '../repositories/user.repository.interface';
import {
  UserProviderRepositoryToken,
  type CreateUserProviderData,
  type UserProviderRepository,
} from '../repositories/user-provider.repository.interface';
import { BookingService } from '../../booking/services/booking.service';
import { collectAdminEmailAddresses } from '../../email/helpers/collect-admin-email-addresses.helper';
import { USER_PROVIDER_NAME_LOCAL } from '../constants/user-provider-name.constant';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @Inject(UserRepositoryToken)
    private readonly userRepo: UserRepository,
    @Inject(UserProviderRepositoryToken)
    private readonly userProviderRepo: UserProviderRepository,
    // Resolve circular dependency, wait for the module to be initialized before using it
    @Inject(forwardRef(() => BookingService))
    private readonly bookingService: BookingService,
    private readonly notificationsService: NotificationsService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Creates a new user in the database.
   * @param data The user data to be created.
   * @returns The newly created user.
   */
  async create(data: CreateUserData): Promise<User> {
    return this.userRepo.create(data);
  }

  /**
   * Finds a user by either their email or user name.
   * @param email The email address of the user.
   * @param userName The user name of the user.
   * @returns The user if found, or null if not found.
   */
  async findByEmailOrUserName(
    email: string,
    userName?: string,
  ): Promise<User | null> {
    return this.userRepo.findByEmailOrUserName(email, userName);
  }

  /**
   * Finds a user by email only.
   * @param email The email address.
   * @returns The user if found, or null.
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.userRepo.findByEmail(email);
  }

  /**
   * Finds a user by userName only.
   * @param userName The username.
   * @returns The user if found, or null.
   */
  async findByUserName(userName: string): Promise<User | null> {
    return this.userRepo.findByUserName(userName);
  }

  /**
   * Finds a user by their id.
   * @param id The id of the user to find.
   * @returns The user if found, or null if not found.
   */
  async findById(id: string): Promise<User> {
    const existingUser = await this.userRepo.findById(id);
    if (!existingUser) {
      throw new NotFoundException(ERROR_MESSAGES.USER.NOT_FOUND);
    }
    return existingUser;
  }

  /**
   * Loads a user by id when absence is valid (JWT validation, webhooks, Stripe).
   * @param id User id.
   */
  async findByIdOrNull(id: string): Promise<User | null> {
    return this.userRepo.findById(id);
  }

  /**
   * Finds users by role with pagination (e.g. in-app admin notifications).
   * @param input Role and page window.
   */
  async findUsersByRole(input: {
    readonly role: UserRole;
    readonly limit: number;
    readonly offset: number;
  }): Promise<User[]> {
    const [users]: [User[], number] = await this.userRepo.findAndCount(
      { role: input.role },
      {
        limit: input.limit,
        offset: input.offset,
        orderBy: { createdAt: SortOrder.DESC },
      },
    );
    return users ?? [];
  }

  /**
   * Gets all users filtered by user type, role, approval status and search.
   * Role-based restrictions:
   * - ADMIN: can see all users
   * - TRAINER: can only see TRAINEE role users
   * - TRAINEE: can only see TRAINER role users with approvalStatus=APPROVED
   * @param query The query object to filter, sort and paginate the users.
   * @param currentUser The user performing the request.
   * @returns The users filtered, sorted and paginated according to the query.
   */
  async getAll(
    query: GetUsersQueryDto,
    currentUser: JwtAuthPayload,
  ): Promise<BaseResponseDto<ResponseUserDto[]>> {
    const {
      page = DEFAULT_PAGE,
      limit = DEFAULT_LIMIT,
      userType,
      approvalStatus,
      search,
      sortBy,
      order,
      role,
    } = query;
    const offset = (page - 1) * limit;
    const filter: UserFindManyFilter = {};
    switch (currentUser.role) {
      case UserRole.ADMIN:
        break;
      case UserRole.TRAINER:
        if (
          role === UserRole.TRAINER &&
          approvalStatus === TrainerApprovalStatus.APPROVED
        ) {
          filter.role = UserRole.TRAINER;
          filter.approvalStatus = TrainerApprovalStatus.APPROVED;
          filter.excludeUserId = currentUser.id;
        } else {
          filter.role = UserRole.TRAINEE;
          const traineeIds =
            await this.bookingService.findTraineeIdsByTrainerId(currentUser.id);
          filter.onlyTraineeIds = traineeIds;
        }
        break;
      case UserRole.TRAINEE:
        filter.role = UserRole.TRAINER;
        filter.approvalStatus = TrainerApprovalStatus.APPROVED;
        break;
      default:
        filter.role = UserRole.TRAINER;
        filter.approvalStatus = TrainerApprovalStatus.APPROVED;
    }
    if (currentUser.role === UserRole.ADMIN) {
      if (userType) {
        filter.userType = userType;
      }
      if (role) {
        filter.role = role;
      }
      if (approvalStatus) {
        filter.approvalStatus = approvalStatus;
      }
    }
    if (search) {
      filter.search = search;
    }
    const orderBy = {
      [sortBy ?? SortBy.CREATED_AT]: order ?? SortOrder.DESC,
    };
    const [data, totalItems] = await this.userRepo.findAndCount(filter, {
      limit,
      offset,
      orderBy,
    });
    return BaseResponseDto.okWithPagination(data, {
      totalItems,
      page,
      limit,
    });
  }

  /**
   * Updates the role of a user.
   * @throws {ForbiddenException} If the user is trying to update their own role.
   * @throws {ForbiddenException} If the user is trying to assign an admin role to another user.
   * @throws {NotFoundException} If the user to be updated is not found.
   * @throws {ForbiddenException} If the user is trying to update the role of an admin.
   * @param targetUserId The id of the user to be updated.
   * @param data The new role of the user.
   * @param currentUser The user performing the update.
   * @returns The updated user.
   */
  async updateUserRole(
    targetUserId: string,
    data: UpdateUserRoleDto,
    currentUser: JwtAuthPayload,
  ): Promise<BaseResponseDto<ResponseUserDto>> {
    if (currentUser.id === targetUserId) {
      throw new ForbiddenException(ERROR_MESSAGES.USER.CANNOT_UPDATE_SELF_ROLE);
    }
    if (data.role === UserRole.ADMIN) {
      throw new ForbiddenException(ERROR_MESSAGES.USER.CANNOT_ASSIGN_ADMIN);
    }
    const targetUser = await this.userRepo.findById(targetUserId);
    if (!targetUser) {
      throw new NotFoundException(ERROR_MESSAGES.USER.NOT_FOUND);
    }
    if (targetUser.role === UserRole.ADMIN) {
      throw new ForbiddenException(ERROR_MESSAGES.USER.ADMIN_UPDATE);
    }
    if (targetUser.userType === UserType.TRAINER) {
      if (data.role === UserRole.TRAINER) {
        targetUser.role = UserRole.TRAINER;
        targetUser.approvalStatus = TrainerApprovalStatus.APPROVED;
      } else if (data.role === UserRole.TRAINEE) {
        targetUser.role = UserRole.TRAINEE;
        targetUser.approvalStatus = TrainerApprovalStatus.REJECTED;
      }
      await this.userRepo.save(targetUser);
      await this.notificationsService.createAndPublishToUsers({
        notifications: [
          {
            recipientUserId: targetUser.id,
            type: NotificationType.UserRoleUpdated,
            ...NotificationTemplates.userRoleUpdated({
              role: targetUser.role,
            }),
            data: { userId: targetUser.id, role: targetUser.role },
          },
        ],
      });
      const frontendUrl: string = (process.env.FRONTEND_URL ?? '').replace(
        /\/$/,
        '',
      );
      const roleEmail = EmailTemplates.userRoleUpdated({
        userName: targetUser.userName,
        newRole: targetUser.role,
        profileUrl: `${frontendUrl}/profile`,
      });
      await this.emailService.send({
        to: targetUser.email,
        subject: roleEmail.subject,
        text: roleEmail.text,
        html: roleEmail.html,
      });
      return BaseResponseDto.ok(targetUser);
    }
    const previousRole = targetUser.role;
    const previousApprovalStatus = targetUser.approvalStatus;
    targetUser.role = data.role;
    if (data.role === UserRole.TRAINER) {
      targetUser.approvalStatus = TrainerApprovalStatus.APPROVED;
    } else {
      targetUser.approvalStatus = TrainerApprovalStatus.NONE;
    }
    const hasRoleOrApprovalChange =
      previousRole !== targetUser.role ||
      previousApprovalStatus !== targetUser.approvalStatus;
    if (!hasRoleOrApprovalChange) {
      return BaseResponseDto.ok(targetUser);
    }
    await this.userRepo.save(targetUser);
    await this.notificationsService.createAndPublishToUsers({
      notifications: [
        {
          recipientUserId: targetUser.id,
          type: NotificationType.UserRoleUpdated,
          ...NotificationTemplates.userRoleUpdated({
            role: targetUser.role,
          }),
          data: { userId: targetUser.id, role: targetUser.role },
        },
      ],
    });
    const frontendUrl: string = (process.env.FRONTEND_URL ?? '').replace(
      /\/$/,
      '',
    );
    const roleUpdatedEmail = EmailTemplates.userRoleUpdated({
      userName: targetUser.userName,
      newRole: targetUser.role,
      profileUrl: `${frontendUrl}/profile`,
    });
    await this.emailService.send({
      to: targetUser.email,
      subject: roleUpdatedEmail.subject,
      text: roleUpdatedEmail.text,
      html: roleUpdatedEmail.html,
    });
    return BaseResponseDto.ok(targetUser);
  }

  /**
   * Submits a trainer application for the current trainee (self-service).
   * @param currentUser The authenticated user from JWT.
   * @returns The updated user profile.
   */
  async requestTrainerRole(
    currentUser: JwtAuthPayload,
  ): Promise<BaseResponseDto<ResponseFullUserDto>> {
    const user = await this.findById(currentUser.id);
    if (user.role !== UserRole.TRAINEE) {
      throw new ForbiddenException(
        ERROR_MESSAGES.USER.CANNOT_REQUEST_TRAINER_ROLE,
      );
    }
    if (user.approvalStatus === TrainerApprovalStatus.APPROVED) {
      throw new ConflictException(
        ERROR_MESSAGES.USER.TRAINER_APPLICATION_ALREADY_APPROVED,
      );
    }
    if (
      user.userType === UserType.TRAINER &&
      user.approvalStatus === TrainerApprovalStatus.PENDING
    ) {
      throw new ConflictException(
        ERROR_MESSAGES.USER.TRAINER_APPLICATION_ALREADY_PENDING,
      );
    }
    let hasChanges = false;
    if (
      user.userType === UserType.TRAINEE &&
      user.approvalStatus === TrainerApprovalStatus.NONE
    ) {
      user.userType = UserType.TRAINER;
      user.approvalStatus = TrainerApprovalStatus.PENDING;
      hasChanges = true;
    } else if (
      user.userType === UserType.TRAINER &&
      user.approvalStatus === TrainerApprovalStatus.REJECTED
    ) {
      user.approvalStatus = TrainerApprovalStatus.PENDING;
      hasChanges = true;
    } else if (
      user.userType === UserType.TRAINER &&
      user.approvalStatus === TrainerApprovalStatus.NONE
    ) {
      user.approvalStatus = TrainerApprovalStatus.PENDING;
      hasChanges = true;
    }
    if (!hasChanges) {
      throw new ConflictException(
        ERROR_MESSAGES.USER.TRAINER_APPLICATION_INVALID_STATE,
      );
    }
    await this.userRepo.save(user);
    try {
      await this.notificationsService.notifyAdmins({
        type: NotificationType.AdminTrainerRoleRequested,
        ...NotificationTemplates.adminTrainerRoleRequested({
          userName: user.userName,
        }),
        data: { userId: user.id, email: user.email },
      });
    } catch (err: unknown) {
      const message: string = err instanceof Error ? err.message : String(err);
      const stack: string | undefined =
        err instanceof Error ? err.stack : undefined;
      this.logger.error(
        `Failed to notify admins after trainer role request: ${message}`,
        stack,
      );
    }
    return BaseResponseDto.ok(
      plainToInstance(ResponseFullUserDto, user, {
        excludeExtraneousValues: true,
        enableImplicitConversion: true,
      }),
    );
  }

  /**
   * Updates the profile of the current user.
   * @param data The user data to be updated.
   * @param currentUser The current user.
   * @returns The updated user profile.
   * @throws NotFoundException If the user is not found.
   */
  async updateProfile(
    data: UpdateUserProfileDto,
    currentUser: JwtAuthPayload,
  ): Promise<BaseResponseDto<ResponseFullUserDto>> {
    const user = await this.findById(currentUser.id);
    if (!user) {
      throw new NotFoundException(ERROR_MESSAGES.USER.NOT_FOUND);
    }
    Object.assign(user, data);
    await this.userRepo.save(user);
    return BaseResponseDto.ok(
      plainToInstance(ResponseFullUserDto, user, {
        excludeExtraneousValues: true,
        enableImplicitConversion: true,
      }),
    );
  }

  /**
   * Persists a user entity (e.g. after password is set in auth).
   * @param user The user to save.
   */
  async saveUser(user: User): Promise<void> {
    await this.userRepo.save(user);
  }

  /**
   * Returns email addresses for users with the ADMIN role (out-of-app notifications).
   */
  async getAdminEmailAddresses(): Promise<readonly string[]> {
    return collectAdminEmailAddresses(this.userRepo);
  }

  /**
   * Looks up a linked identity in user_providers.
   * @param args Provider name and id from the IdP.
   */
  async findUserProviderByIdentity(args: {
    providerName: string;
    providerUserId: string;
  }): Promise<UserProvider | null> {
    return this.userProviderRepo.findByProviderIdentity(args);
  }

  /**
   * Inserts a user_providers row for a linked identity.
   * @param data The provider link to store.
   */
  async createUserProvider(
    data: CreateUserProviderData,
  ): Promise<UserProvider> {
    return this.userProviderRepo.create(data);
  }

  /**
   * Records local (email + password) in user_providers when missing.
   * Backfills users created before multi-provider support; coexists with auth0 rows.
   * @param user The user to attach a local provider row to if absent.
   */
  async ensureLocalUserProviderForUser(user: User): Promise<void> {
    const providerUserId: string = user.email.trim().toLowerCase();
    const existing: UserProvider | null =
      await this.userProviderRepo.findByProviderIdentity({
        providerName: USER_PROVIDER_NAME_LOCAL,
        providerUserId,
      });
    if (existing) {
      return;
    }
    await this.userProviderRepo.create({
      userId: user.id,
      providerName: USER_PROVIDER_NAME_LOCAL,
      providerUserId,
    });
  }

  /**
   * Derives a unique username from an email (Auth0 and similar sign-up).
   * @param email The email to derive a base name from.
   */
  async pickUniqueUserNameFromEmail(email: string): Promise<string> {
    const local: string =
      (email.split('@')[0] ?? 'user').replace(/[^a-zA-Z0-9_]/g, '_') || 'user';
    const base: string = local.slice(0, 24);
    let candidate: string = base;
    for (let i = 0; i < 1000; i += 1) {
      const existing: User | null = await this.findByUserName(candidate);
      if (!existing) {
        return candidate;
      }
      candidate = `${base}_${i + 1}`;
    }
    throw new ConflictException(ERROR_MESSAGES.USER.USERNAME_TAKEN);
  }
}
