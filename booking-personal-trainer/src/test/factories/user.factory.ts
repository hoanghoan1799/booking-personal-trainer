import { EntityManager } from '@mikro-orm/core';
import { randomBytes } from 'crypto';

// Enums
import {
  TrainerApprovalStatus,
  UserRole,
  UserStatus,
  UserType,
} from '../../common/enums/user/user.enum';

// Entities
import { User } from '../../modules/user/entities/user.entity';

const uniqueSuffix = (): string =>
  `${Date.now()}-${randomBytes(3).toString('hex')}`;

export const createTestTrainee = async (
  em: EntityManager,
  overrides: Partial<
    Pick<User, 'email' | 'userName' | 'firstName' | 'lastName'>
  > = {},
): Promise<User> => {
  const user: User = em.create(User, {
    email: overrides.email ?? `trainee-${uniqueSuffix()}@e2e.test`,
    userName: overrides.userName ?? `tr-${uniqueSuffix()}`,
    firstName: overrides.firstName ?? 'E2E',
    lastName: overrides.lastName ?? 'Trainee',
    userType: UserType.TRAINEE,
    role: UserRole.TRAINEE,
    approvalStatus: TrainerApprovalStatus.NONE,
    status: UserStatus.ACTIVE,
  });
  await em.persistAndFlush(user);
  return user;
};

export const createTestTrainer = async (
  em: EntityManager,
  overrides: Partial<
    Pick<User, 'email' | 'userName' | 'firstName' | 'lastName'>
  > = {},
): Promise<User> => {
  const user: User = em.create(User, {
    email: overrides.email ?? `trainer-${uniqueSuffix()}@e2e.test`,
    userName: overrides.userName ?? `t-${uniqueSuffix()}`,
    firstName: overrides.firstName ?? 'E2E',
    lastName: overrides.lastName ?? 'Trainer',
    userType: UserType.TRAINER,
    role: UserRole.TRAINER,
    approvalStatus: TrainerApprovalStatus.APPROVED,
    status: UserStatus.ACTIVE,
  });
  await em.persistAndFlush(user);
  return user;
};

export const createTestAdmin = async (
  em: EntityManager,
  overrides: Partial<
    Pick<User, 'email' | 'userName' | 'firstName' | 'lastName'>
  > = {},
): Promise<User> => {
  const user: User = em.create(User, {
    email: overrides.email ?? `admin-${uniqueSuffix()}@e2e.test`,
    userName: overrides.userName ?? `adm-${uniqueSuffix()}`,
    firstName: overrides.firstName ?? 'E2E',
    lastName: overrides.lastName ?? 'Admin',
    userType: UserType.TRAINEE,
    role: UserRole.ADMIN,
    approvalStatus: TrainerApprovalStatus.NONE,
    status: UserStatus.ACTIVE,
  });
  await em.persistAndFlush(user);
  return user;
};
