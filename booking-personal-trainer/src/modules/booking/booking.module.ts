import { Module, forwardRef } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';

// Entities
import { Booking } from './entities/booking.entity';

// Services
import { BookingService } from './booking.service';

// Controllers
import { BookingController } from './booking.controller';

// Repositories
import { BookingRepositoryToken } from './repositories/booking.repository.interface';
import { MikroOrmBookingRepository } from './repositories/mikroorm-booking.repository';

// Modules
import { UserModule } from '../user/user.module';

@Module({
  imports: [MikroOrmModule.forFeature([Booking]), forwardRef(() => UserModule)],
  controllers: [BookingController],
  providers: [
    BookingService,
    {
      provide: BookingRepositoryToken,
      useClass: MikroOrmBookingRepository,
    },
  ],
  exports: [BookingRepositoryToken],
})
export class BookingModule {}
