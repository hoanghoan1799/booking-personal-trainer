import { Entity, Property, Enum, Unique } from '@mikro-orm/core';
import { BaseEntity } from 'src/common/entities/base.entity';
import { ApprovalStatus } from 'src/common/enums/base/base.enum';
import {
  UserRole,
  UserStatus,
  UserType,
} from 'src/common/enums/user/user.enum';

@Entity({ tableName: 'users' })
export class User extends BaseEntity {
  @Property()
  @Unique()
  userName!: string;

  @Property()
  @Unique()
  email!: string;

  @Property({ hidden: true })
  password!: string;

  @Property()
  firstName!: string;

  @Property()
  lastName!: string;

  @Enum(() => UserRole)
  role!: UserRole;

  @Enum(() => UserType)
  userType!: UserType;

  @Enum(() => ApprovalStatus)
  approvalStatus: ApprovalStatus = ApprovalStatus.NONE;

  @Enum(() => UserStatus)
  status: UserStatus = UserStatus.ACTIVE;

  @Property({ nullable: true })
  age?: number;

  @Property({ nullable: true })
  height?: number;

  @Property({ nullable: true })
  weight?: number;
}
