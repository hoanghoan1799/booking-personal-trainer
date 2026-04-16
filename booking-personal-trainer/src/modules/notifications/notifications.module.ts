import { Module, forwardRef } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';

// Entities
import { Notification } from './entities/notification.entity';

// Modules
import { RedisModule } from '../redis/redis.module';
import { UserModule } from '../user/user.module';

// Services
import { NotificationsService } from './notifications.service';

// Controllers
import { NotificationsController } from './notifications.controller';
import { NotificationsSseController } from './notifications-sse.controller';

// Repositories
import { NotificationRepositoryToken } from './repositories/notification.repository.interface';
import { MikroOrmNotificationRepository } from './repositories/mikroorm-notification.repository';

@Module({
  imports: [
    MikroOrmModule.forFeature([Notification]),
    RedisModule,
    forwardRef(() => UserModule),
  ],
  controllers: [NotificationsController, NotificationsSseController],
  providers: [
    NotificationsService,
    {
      provide: NotificationRepositoryToken,
      useClass: MikroOrmNotificationRepository,
    },
  ],
  exports: [NotificationsService, NotificationRepositoryToken],
})
export class NotificationsModule {}
