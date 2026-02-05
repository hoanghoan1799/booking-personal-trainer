import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';

// Entities
import { Booking } from './entities/booking.entity';
import { User } from '../user/entities/user.entity';

// Services
import { BookingService } from './booking.service';
import { UserService } from '../user/user.service';

// Controllers
import { BookingController } from './booking.controller';

@Module({
  imports: [MikroOrmModule.forFeature([Booking, User])],
  controllers: [BookingController],
  providers: [BookingService, UserService],
})
export class BookingModule {}
