import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository, FilterQuery } from '@mikro-orm/core';

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

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepo: EntityRepository<User>,
    private readonly em: EntityManager,
  ) {}

  /**
   * Creates a new user in the database.
   * @param data The user data to be created.
   * @returns The newly created user.
   */
  async create(data: RegisterDto): Promise<User> {
    const newUser: User = this.userRepo.create({
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

    await this.em.persist(newUser).flush();

    return newUser;
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
    return this.userRepo.findOne({
      $or: [{ userName }, { email }],
    });
  }

  /**
   * Finds a user by their id.
   * @param id The id of the user to find.
   * @returns The user if found, or null if not found.
   */
  async findById(id: string): Promise<User> {
    const existingUser = await this.userRepo.findOne({ id });

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

    const where: FilterQuery<User> = {};

    switch (currentUser.role) {
      case UserRole.ADMIN:
        break;
      case UserRole.TRAINER:
        where.role = UserRole.TRAINEE;
        break;
      case UserRole.TRAINEE:
        where.role = UserRole.TRAINER;
        where.approvalStatus = TrainerApprovalStatus.APPROVED;
        break;
      default:
        where.role = UserRole.TRAINER;
        where.approvalStatus = TrainerApprovalStatus.APPROVED;
    }

    if (currentUser.role === UserRole.ADMIN) {
      if (userType) {
        where.userType = userType;
      }

      if (role) {
        where.role = role;
      }

      if (approvalStatus) {
        where.approvalStatus = approvalStatus;
      }
    }

    if (search) {
      where.$or = [
        { email: { $ilike: `%${search}%` } },
        { userName: { $ilike: `%${search}%` } },
      ];
    }

    const orderBy = {
      [sortBy ?? SortBy.CREATED_AT]: order ?? SortOrder.DESC,
    };

    const [data, totalItems] = await this.userRepo.findAndCount(where, {
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
    // Check if the user is trying to update their own role
    if (currentUser.id === targetUserId) {
      throw new ForbiddenException(ERROR_MESSAGES.USER.CANNOT_UPDATE_SELF_ROLE);
    }

    if (data.role === UserRole.ADMIN) {
      throw new ForbiddenException(ERROR_MESSAGES.USER.CANNOT_ASSIGN_ADMIN);
    }

    const targetUser = await this.userRepo.findOne({ id: targetUserId });

    if (!targetUser) {
      throw new NotFoundException(ERROR_MESSAGES.USER.NOT_FOUND);
    }

    // Check if the user is trying to update the role of an admin
    if (targetUser.role === UserRole.ADMIN) {
      throw new ForbiddenException(ERROR_MESSAGES.USER.ADMIN_UPDATE);
    }

    if (targetUser.userType === UserType.TRAINER) {
      // ADMIN APPROVE
      if (data.role === UserRole.TRAINER) {
        targetUser.role = UserRole.TRAINER;
        targetUser.approvalStatus = TrainerApprovalStatus.APPROVED;
      }

      // ADMIN REJECT
      else if (data.role === UserRole.TRAINEE) {
        targetUser.role = UserRole.TRAINEE;
        targetUser.approvalStatus = TrainerApprovalStatus.REJECTED;
      }

      await this.em.persist(targetUser).flush();

      return BaseResponseDto.ok(targetUser);
    }

    if (targetUser.role === data.role) {
      return BaseResponseDto.ok(targetUser);
    }

    targetUser.role = data.role;
    targetUser.approvalStatus = TrainerApprovalStatus.NONE;

    await this.em.persist(targetUser).flush();

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

    await this.em.persist(user).flush();

    return BaseResponseDto.ok(user);
  }
}
