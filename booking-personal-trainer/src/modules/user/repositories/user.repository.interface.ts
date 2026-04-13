// Commons
import {
  TrainerApprovalStatus,
  UserRole,
  UserStatus,
  UserType,
} from '../../../common/enums/user/user.enum';
import { SortOrder } from '../../../common/enums/pagination/pagination.enum';

// Entities
import { User } from '../entities/user.entity';

/** Injection token for UserRepository */
export const UserRepositoryToken = Symbol('UserRepository');

export interface CreateUserData {
  email: string;
  password?: string;
  userName: string;
  userType: UserType;
  firstName: string;
  lastName: string;
  role: UserRole;
  approvalStatus: TrainerApprovalStatus;
  status: UserStatus;
}

export interface UserFindManyFilter {
  role?: UserRole;
  approvalStatus?: TrainerApprovalStatus;
  userType?: UserType;
  search?: string;
  excludeUserId?: string;
  onlyTraineeIds?: string[];
}

export interface FindManyOptions {
  limit: number;
  offset: number;
  orderBy: Record<string, SortOrder>;
}

/**
 * Port for user persistence. Implement with MikroORM, Prisma, TypeORM, etc.
 */
export interface UserRepository {
  create(data: CreateUserData): Promise<User>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByUserName(userName: string): Promise<User | null>;
  findOneByRole(role: UserRole): Promise<User | null>;
  findByEmailOrUserName(email: string, userName?: string): Promise<User | null>;
  findAndCount(
    filter: UserFindManyFilter,
    options: FindManyOptions,
  ): Promise<[User[], number]>;
  save(user: User): Promise<void>;
}
