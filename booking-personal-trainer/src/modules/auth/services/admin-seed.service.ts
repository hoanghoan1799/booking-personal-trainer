import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable, OnModuleInit } from '@nestjs/common';
import {
  EntityManager,
  EntityRepository,
  CreateRequestContext,
} from '@mikro-orm/core';
import { ConfigService } from '@nestjs/config';

// Commons
import {
  TrainerApprovalStatus,
  UserRole,
  UserStatus,
  UserType,
} from '../../../common/enums/user/user.enum';

// Entities
import { User } from '../../../modules/user/entities/user.entity';

// Services
import { HashingService } from './hashing.service';

const DEFAULT_ADMIN_EMAIL = 'hoan.hoang@asnet.com.vn' as const;
const DEFAULT_ADMIN_PASSWORD = 'Password123!' as const;

@Injectable()
export class AdminSeedService implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: EntityRepository<User>,
    private readonly em: EntityManager,
    private readonly configService: ConfigService,
    private readonly hashingService: HashingService,
  ) {}

  @CreateRequestContext()
  async onModuleInit() {
    if (process.env.NODE_ENV === 'production') return;

    const adminEmail = this.configService.get<string>(
      'DEFAULT_ADMIN_EMAIL',
      DEFAULT_ADMIN_EMAIL,
    );
    const adminPassword = this.configService.get<string>(
      'DEFAULT_ADMIN_PASSWORD',
      DEFAULT_ADMIN_PASSWORD,
    );

    if (!adminEmail || !adminPassword) {
      console.warn('⚠️ Default admin env not set');
      return;
    }

    const existedAdmin = await this.userRepo.findOne({
      role: UserRole.ADMIN,
    });

    if (existedAdmin) {
      return;
    }

    const hashedPassword = await this.hashingService.hash(adminPassword);

    const admin = this.userRepo.create({
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

    await this.em.persist(admin).flush();

    console.log('🚀 Default admin created');
  }
}
