import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';

// Entities
import { Workout } from './entities/workout.entity';
import { WorkoutExercise } from './entities/workout-exercise.entity';
import { User } from '../user/entities/user.entity';
import { Exercise } from '../exercise/entities/exercise.entity';

// Services
import { WorkoutService } from './services/workout.service';

// Controllers
import { WorkoutController } from './controllers/workout.controller';
import { BookingWorkoutController } from './controllers/booking-workout.controller';

// Repositories
import { WorkoutRepositoryToken } from './repositories/workout.repository.interface';
import { MikroOrmWorkoutRepository } from './repositories/mikroorm-workout.repository';

// Modules
import { UserModule } from '../user/user.module';
import { ExerciseModule } from '../exercise/exercise.module';
import { BookingModule } from '../booking/booking.module';
import { TemplatesModule } from '../templates/templates.module';
import { PaymentsModule } from '../payments/payments.module';
import { BillingModule } from '../billing/billing.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    ExerciseModule,
    UserModule,
    BookingModule,
    TemplatesModule,
    PaymentsModule,
    BillingModule,
    NotificationsModule,
    EmailModule,
    MikroOrmModule.forFeature([Workout, WorkoutExercise, User, Exercise]),
  ],
  controllers: [WorkoutController, BookingWorkoutController],
  providers: [
    WorkoutService,
    {
      provide: WorkoutRepositoryToken,
      useClass: MikroOrmWorkoutRepository,
    },
  ],
})
export class WorkoutModule {}
