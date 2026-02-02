import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';

// Entities
import { RefreshToken } from './entities/refresh-token.entity';

// Services
import { AuthService } from './auth.service';

// Controllers
import { AuthController } from './auth.controller';

@Module({
  imports: [MikroOrmModule.forFeature([RefreshToken])],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
