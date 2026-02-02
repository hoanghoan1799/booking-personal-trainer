import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';

// Entities
import { Booking } from './entities/booking.entity';

// Services
import { BookingService } from './booking.service';

// Controllers
import { BookingController } from './booking.controller';

@Module({
  imports: [MikroOrmModule.forFeature([Booking])],
  controllers: [BookingController],
  providers: [BookingService],
})
export class BookingModule {}
