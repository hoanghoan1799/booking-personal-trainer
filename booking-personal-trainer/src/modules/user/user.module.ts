import { Module, forwardRef } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';

// Entities
import { User } from './entities/user.entity';

// Services
import { UserService } from './user.service';

// Controllers
import { UserController } from './user.controller';

// Repositories
import { UserRepositoryToken } from './repositories/user.repository.interface';
import { MikroOrmUserRepository } from './repositories/mikroorm-user.repository';

// Modules
import { BookingModule } from '../booking/booking.module';

@Module({
  imports: [MikroOrmModule.forFeature([User]), forwardRef(() => BookingModule)],
  controllers: [UserController],
  providers: [
    UserService,
    {
      provide: UserRepositoryToken,
      useClass: MikroOrmUserRepository,
    },
  ],
  exports: [UserService, UserRepositoryToken],
})
export class UserModule {}
