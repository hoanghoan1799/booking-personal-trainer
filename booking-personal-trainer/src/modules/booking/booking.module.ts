import { Module, forwardRef } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';

// Entities
import { Booking } from './entities/booking.entity';

// Services
import { BookingService } from './booking.service';
import { BookingAvailabilityService } from './services/booking-availability.service';

// Controllers
import { BookingController } from './booking.controller';
import { BookingDiscoveryController } from './booking-discovery.controller';

// Repositories
import { BookingRepositoryToken } from './repositories/booking.repository.interface';
import { MikroOrmBookingRepository } from './repositories/mikroorm-booking.repository';

// Modules
import { UserModule } from '../user/user.module';
import { TrainerSchedulingModule } from '../trainer-scheduling/trainer-scheduling.module';

@Module({
  imports: [
    MikroOrmModule.forFeature([Booking]),
    forwardRef(() => UserModule),
    TrainerSchedulingModule,
  ],
  controllers: [BookingController, BookingDiscoveryController],
  providers: [
    BookingService,
    BookingAvailabilityService,
    {
      provide: BookingRepositoryToken,
      useClass: MikroOrmBookingRepository,
    },
  ],
  exports: [BookingRepositoryToken],
})
export class BookingModule {}
