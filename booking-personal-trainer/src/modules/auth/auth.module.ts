import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ConfigModule, ConfigService } from '@nestjs/config';

// Commons
import { JwtStrategy } from '../../common/strategies/jwt.strategy';
import { TOKEN_EXPIRATION } from '../../common/constants/token.constants';

// Entities
import { User } from '../user/entities/user.entity';

// Services
import { AuthService } from './auth.service';
import { HashingService } from './services/hashing.service';
import { BcryptService } from './services/bcrypt.service';

// Controllers
import { AuthController } from './auth.controller';

// Modules
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    UserModule,
    MikroOrmModule.forFeature([User]),
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
    JwtStrategy,
    {
      provide: HashingService,
      useClass: BcryptService,
    },
  ],
})
export class AuthModule {}
