import { Module, forwardRef } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';

// Entities
import { User } from './entities/user.entity';
import { UserProvider } from './entities/user-provider.entity';

// Services
import { UserService } from './user.service';

// Controllers
import { UserController } from './user.controller';

// Repositories
import { UserRepositoryToken } from './repositories/user.repository.interface';
import { MikroOrmUserRepository } from './repositories/mikroorm-user.repository';
import { UserProviderRepositoryToken } from './repositories/user-provider.repository.interface';
import { MikroOrmUserProviderRepository } from './repositories/mikroorm-user-provider.repository';

// Modules
import { BookingModule } from '../booking/booking.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MikroOrmModule.forFeature([User, UserProvider]),
    forwardRef(() => BookingModule),
    forwardRef(() => NotificationsModule),
  ],
  controllers: [UserController],
  providers: [
    UserService,
    {
      provide: UserRepositoryToken,
      useClass: MikroOrmUserRepository,
    },
    {
      provide: UserProviderRepositoryToken,
      useClass: MikroOrmUserProviderRepository,
    },
  ],
  exports: [UserService, UserRepositoryToken, UserProviderRepositoryToken],
})
export class UserModule {}
