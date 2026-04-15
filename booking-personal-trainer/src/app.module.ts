import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { PassportModule } from '@nestjs/passport';
import { redisStore } from 'cache-manager-redis-store';
import { ThrottlerModule } from '@nestjs/throttler';

// Constants
import {
  DEFAULT_HOST,
  DEFAULT_REDIS_PORT,
} from './common/constants/app.constant';

// Guards
import { RateLimitGuard } from './common/guards/rate-limit.guard';

// Modules
import { DatabaseModule } from './modules/database/database.module';
import { UserModule } from './modules/user/user.module';
import { BookingModule } from './modules/booking/booking.module';
import { WorkoutModule } from './modules/workout/workout.module';
import { AuthModule } from './modules/auth/auth.module';
import { RedisModule } from './modules/redis/redis.module';
import { ExerciseModule } from './modules/exercise/exercise.module';
import { TemplatesModule } from './modules/templates/templates.module';
import { TrainerSchedulingModule } from './modules/trainer-scheduling/trainer-scheduling.module';
import { BillingModule } from './modules/billing/billing.module';
import { PaymentsModule } from './modules/payments/payments.module';

// Configs
import { RATE_LIMIT_OPTIONS } from './configs/rate-limit.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot(RATE_LIMIT_OPTIONS),
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
    ExerciseModule,
    TemplatesModule,
    TrainerSchedulingModule,
    BillingModule,
    PaymentsModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: RateLimitGuard,
    },
  ],
})
export class AppModule {}
