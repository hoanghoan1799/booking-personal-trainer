import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

// Commons
import { JwtStrategy } from '../../common/strategies/jwt.strategy';
import { TOKEN_EXPIRATION } from '../../common/constants/token.constants';

// Services
import { AuthService } from './auth.service';
import { HashingService } from './services/hashing.service';
import { BcryptService } from './services/bcrypt.service';
import { RefreshTokenService } from './services/refresh-token.service';
import { AdminSeedService } from './services/admin-seed.service';
import { TokenVerifierService } from './services/token-verifier.service';

// Controllers
import { AuthController } from './auth.controller';

// Modules
import { UserModule } from '../user/user.module';
import { RedisModule } from '../redis/redis.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    UserModule,
    RedisModule,
    NotificationsModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        global: true,
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: TOKEN_EXPIRATION.ACCESS },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AdminSeedService,
    TokenVerifierService,
    JwtStrategy,
    RefreshTokenService,
    {
      provide: HashingService,
      useClass: BcryptService,
    },
  ],
})
export class AuthModule {}
