import { Module, forwardRef } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';

// Entities
import { Booking } from './entities/booking.entity';
import { BookingSeries } from './entities/booking-series.entity';

// Services
import { BookingService } from './services/booking.service';
import { BookingAvailabilityService } from './services/booking-availability.service';

// Controllers
import { BookingController } from './controllers/booking.controller';
import { BookingDiscoveryController } from './controllers/booking-discovery.controller';

// Repositories
import { BookingRepositoryToken } from './repositories/booking.repository.interface';
import { MikroOrmBookingRepository } from './repositories/mikroorm-booking.repository';

// Modules
import { UserModule } from '../user/user.module';
import { TrainerSchedulingModule } from '../trainer-scheduling/trainer-scheduling.module';
import { PaymentsModule } from '../payments/payments.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    MikroOrmModule.forFeature([Booking, BookingSeries]),
    forwardRef(() => UserModule),
    TrainerSchedulingModule,
    forwardRef(() => PaymentsModule),
    NotificationsModule,
    EmailModule,
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
  exports: [BookingRepositoryToken, BookingService],
})
export class BookingModule {}
