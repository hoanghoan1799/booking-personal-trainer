import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { redisStore } from 'cache-manager-redis-store';

// Constants
import {
  DEFAULT_HOST,
  DEFAULT_REDIS_PORT,
} from './common/constants/app.constant';

// Modules
import { DatabaseModule } from './modules/database/database.module';
import { UserModule } from './modules/user/user.module';
import { BookingModule } from './modules/booking/booking.module';
import { WorkoutModule } from './modules/workout/workout.module';
import { AuthModule } from './modules/auth/auth.module';
import { RedisModule } from './modules/redis/redis.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        store: redisStore,
        host: configService.get<string>('REDIS_HOST', DEFAULT_HOST),
        port: configService.get<number>('REDIS_PORT', DEFAULT_REDIS_PORT),
      }),
      inject: [ConfigService],
    }),
    DatabaseModule,
    UserModule,
    BookingModule,
    WorkoutModule,
    AuthModule,
    RedisModule,
    PassportModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
