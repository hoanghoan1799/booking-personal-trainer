import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
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

// Repositories
import { UserRepositoryToken } from '../../user/repositories/user.repository.interface';
import type { UserRepository } from '../../user/repositories/user.repository.interface';

const DEFAULT_ADMIN_EMAIL = 'hoan.hoang@asnet.com.vn' as const;
const DEFAULT_ADMIN_PASSWORD = 'Abcd@123' as const;

@Injectable()
export class AdminSeedService implements OnModuleInit {
  constructor(
    @Inject(UserRepositoryToken)
    private readonly userRepo: UserRepository,
    private readonly configService: ConfigService,
    private readonly hashingService: HashingService,
  ) {}

  async onModuleInit() {
    const adminEmail = this.configService.get<string>(
      'DEFAULT_ADMIN_EMAIL',
      DEFAULT_ADMIN_EMAIL,
    );
    const adminPassword = this.configService.get<string>(
      'DEFAULT_ADMIN_PASSWORD',
      DEFAULT_ADMIN_PASSWORD,
    );

    if (!adminEmail || !adminPassword) {
      console.warn('Default admin env not set');
      return;
    }

    const existedAdmin = await this.userRepo.findOneByRole(UserRole.ADMIN);

    if (existedAdmin) {
      return;
    }

    const hashedPassword = await this.hashingService.hash(adminPassword);

    await this.userRepo.create({
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
  }
}
