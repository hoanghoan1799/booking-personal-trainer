import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

// DTOs
import { RegisterDto } from '../auth/dtos/register.dto';
import { ResponseFullUserDto, ResponseUserDto } from './dtos/response-user.dto';

// Commons
import { ERROR_MESSAGES } from '../../common/constants/message.constant';
import {
  TrainerApprovalStatus,
  UserRole,
  UserType,
} from '../../common/enums/user/user.enum';
import {
  SortBy,
  SortOrder,
} from '../../common/enums/pagination/pagination.enum';

// Types
import type { JwtAuthPayload } from '../auth/types/jwt-auth.type';

// Entities
import { User } from './entities/user.entity';

// DTOs
import {
  UpdateUserProfileDto,
  UpdateUserRoleDto,
} from './dtos/update-user.dto';
import { GetUsersQueryDto } from './dtos/get-user.dto';
import { BaseResponseDto } from '../../common/dtos/base-response.dto';

// Repositories
import {
  UserRepositoryToken,
  type UserRepository,
  type UserFindManyFilter,
} from './repositories/user.repository.interface';
import { BookingRepositoryToken } from '../booking/repositories/booking.repository.interface';
import type { BookingRepository } from '../booking/repositories/booking.repository.interface';

@Injectable()
export class UserService {
  constructor(
    @Inject(UserRepositoryToken)
    private readonly userRepo: UserRepository,
    @Inject(BookingRepositoryToken)
    private readonly bookingRepo: BookingRepository,
  ) {}

  /**
   * Creates a new user in the database.
   * @param data The user data to be created.
   * @returns The newly created user.
   */
  async create(data: RegisterDto): Promise<User> {
    return this.userRepo.create({
      email: data.email,
      password: data.password,
      userName: data.userName,
      userType: data.userType,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role,
      approvalStatus: data.approvalStatus,
      status: data.status,
    });
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
      page = 1,
      limit = 20,
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
          const traineeIds = await this.bookingRepo.findTraineeIdsByTrainerId(
            currentUser.id,
          );
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
      return BaseResponseDto.ok(targetUser);
    }

    if (targetUser.role === data.role) {
      return BaseResponseDto.ok(targetUser);
    }

    targetUser.role = data.role;
    targetUser.approvalStatus = TrainerApprovalStatus.NONE;
    await this.userRepo.save(targetUser);

    return BaseResponseDto.ok(targetUser);
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

    return BaseResponseDto.ok(user);
  }
}
