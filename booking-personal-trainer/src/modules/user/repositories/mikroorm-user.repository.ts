import { Injectable } from '@nestjs/common';
import { EntityManager, EntityRepository, FilterQuery } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';

import {
  SortBy,
  SortOrder,
} from '../../../common/enums/pagination/pagination.enum';
import { UserRole } from '../../../common/enums/user/user.enum';
import { User } from '../entities/user.entity';
import {
  UserRepository,
  CreateUserData,
  UserFindManyFilter,
  FindManyOptions,
} from './user.repository.interface';

@Injectable()
export class MikroOrmUserRepository implements UserRepository {
  constructor(
    @InjectRepository(User)
    private readonly repo: EntityRepository<User>,
    private readonly em: EntityManager,
  ) {}

  async create(data: CreateUserData): Promise<User> {
    const user = this.repo.create({
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
    await this.em.persist(user).flush();
    return user;
  }

  async findById(id: string): Promise<User | null> {
    return this.repo.findOne({ id });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.repo.findOne({ email });
  }

  async findByUserName(userName: string): Promise<User | null> {
    return this.repo.findOne({ userName });
  }

  async findOneByRole(role: UserRole): Promise<User | null> {
    return this.repo.findOne({ role });
  }

  async findByEmailOrUserName(
    email: string,
    userName?: string,
  ): Promise<User | null> {
    return this.repo.findOne({
      $or: [{ userName }, { email }].filter((x) => x != null),
    });
  }

  async findAndCount(
    filter: UserFindManyFilter,
    options: FindManyOptions,
  ): Promise<[User[], number]> {
    const where: FilterQuery<User> = {};
    if (filter.role != null) {
      where.role = filter.role;
    }
    if (filter.approvalStatus != null) {
      where.approvalStatus = filter.approvalStatus;
    }
    if (filter.userType != null) {
      where.userType = filter.userType;
    }
    if (filter.excludeUserId != null) {
      where.id = { $ne: filter.excludeUserId };
    }
    if (filter.onlyTraineeIds != null && filter.onlyTraineeIds.length > 0) {
      where.id = { $in: filter.onlyTraineeIds };
    }
    if (filter.onlyTraineeIds != null && filter.onlyTraineeIds.length === 0) {
      where.id = { $in: [] };
    }
    if (filter.search != null && filter.search.trim() !== '') {
      where.$or = [
        { email: { $ilike: `%${filter.search}%` } },
        { userName: { $ilike: `%${filter.search}%` } },
      ];
    }
    const orderBy =
      options.orderBy && Object.keys(options.orderBy).length > 0
        ? (options.orderBy as Record<string, 'ASC' | 'DESC'>)
        : { [SortBy.CREATED_AT]: SortOrder.DESC };

    return this.repo.findAndCount(where, {
      limit: options.limit,
      offset: options.offset,
      orderBy,
    });
  }

  async save(user: User): Promise<void> {
    await this.em.persist(user).flush();
  }
}
