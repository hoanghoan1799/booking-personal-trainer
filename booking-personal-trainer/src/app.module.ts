import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';

// Modules
import { DatabaseModule } from './modules/database/database.module';
import { UserModule } from './modules/user/user.module';
import { BookingModule } from './modules/booking/booking.module';
import { WorkoutModule } from './modules/workout/workout.module';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    UserModule,
    BookingModule,
    WorkoutModule,
    AuthModule,
    PassportModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
