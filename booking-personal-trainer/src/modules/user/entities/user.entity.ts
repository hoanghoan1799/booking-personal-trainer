import { Entity, Property, Enum, Unique, OneToMany } from '@mikro-orm/core';
import { BaseEntity } from '../../../common/entities/base.entity';
import {
  TrainerApprovalStatus,
  UserRole,
  UserStatus,
  UserType,
} from '../../../common/enums/user/user.enum';
import { RefreshToken } from '../../../modules/auth/entities/refresh-token.entity';
import { Booking } from '../../../modules/booking/entities/booking.entity';
import { Workout } from '../../../modules/workout/entities/workout.entity';

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

  @Enum(() => TrainerApprovalStatus)
  approvalStatus: TrainerApprovalStatus = TrainerApprovalStatus.NONE;

  @Enum(() => UserStatus)
  status: UserStatus = UserStatus.ACTIVE;

  @Property({ nullable: true })
  age?: number;

  @Property({ nullable: true })
  height?: number;

  @Property({ nullable: true })
  weight?: number;

  @OneToMany(() => RefreshToken, (token) => token.user)
  refreshTokens = new Array<RefreshToken>();

  @OneToMany(() => Booking, (booking) => booking.trainer)
  trainerBookings = new Array<Booking>();

  @OneToMany(() => Booking, (booking) => booking.trainee)
  traineeBookings = new Array<Booking>();

  @OneToMany(() => Workout, (workout) => workout.trainer)
  trainerWorkouts = new Array<Workout>();

  @OneToMany(() => Workout, (workout) => workout.trainee)
  traineeWorkouts = new Array<Workout>();
}
