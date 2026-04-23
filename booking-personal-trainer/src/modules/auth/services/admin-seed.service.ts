import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Commons
import {
  TrainerApprovalStatus,
  UserRole,
  UserStatus,
  UserType,
} from '../../../common/enums/user/user.enum';

// Services
import { HashingService } from './hashing.service';
import { UserService } from '../../user/services/user.service';

import { AuthAdminSeedConstants } from '../constants/auth-admin-seed.constants';

@Injectable()
export class AdminSeedService implements OnModuleInit {
  constructor(
    private readonly userService: UserService,
    private readonly configService: ConfigService,
    private readonly hashingService: HashingService,
  ) {}

  async onModuleInit() {
    const adminEmail = this.configService.get<string>(
      'DEFAULT_ADMIN_EMAIL',
      AuthAdminSeedConstants.DefaultAdminEmail,
    );
    const adminPassword = this.configService.get<string>(
      'DEFAULT_ADMIN_PASSWORD',
      AuthAdminSeedConstants.DefaultAdminPassword,
    );

    if (!adminEmail || !adminPassword) {
      console.warn('Default admin env not set');
      return;
    }

    const existedAdmin = await this.userService.findByEmail(adminEmail);

    if (existedAdmin) {
      console.log('Admin already exists');
      return;
    }

    const hashedPassword = await this.hashingService.hash(adminPassword);
    try {
      await this.userService.create({
        email: adminEmail,
        password: hashedPassword,
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
        approvalStatus: TrainerApprovalStatus.APPROVED,
        firstName: 'Hoan',
        lastName: 'Hoang',
        userName: 'Hoan Admin',
        userType: UserType.TRAINER,
      });

      console.log('Default admin created');
    } catch (error) {
      console.error('Failed to create default admin', error);
    }
  }
}
