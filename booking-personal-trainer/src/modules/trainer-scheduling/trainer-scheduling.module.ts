import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';

// Entities
import { TrainerAvailability } from './entities/trainer-availability.entity';
import { TrainerTimeOff } from './entities/trainer-time-off.entity';

// Controllers
import { TrainersController } from './controllers/trainers.controller';

// Services
import { TrainerAvailabilityService } from './services/trainer-availability.service';
import { TrainerScheduleConflictService } from './services/trainer-schedule-conflict.service';
import { TrainerTimeOffService } from './services/trainer-time-off.service';

// Repositories
import { TrainerAvailabilityRepositoryToken } from './repositories/trainer-availability.repository.interface';
import { MikroOrmTrainerAvailabilityRepository } from './repositories/mikroorm-trainer-availability.repository';
import { TrainerTimeOffRepositoryToken } from './repositories/trainer-time-off.repository.interface';
import { MikroOrmTrainerTimeOffRepository } from './repositories/mikroorm-trainer-time-off.repository';

@Module({
  imports: [MikroOrmModule.forFeature([TrainerAvailability, TrainerTimeOff])],
  controllers: [TrainersController],
  providers: [
    TrainerScheduleConflictService,
    TrainerAvailabilityService,
    TrainerTimeOffService,
    {
      provide: TrainerAvailabilityRepositoryToken,
      useClass: MikroOrmTrainerAvailabilityRepository,
    },
    {
      provide: TrainerTimeOffRepositoryToken,
      useClass: MikroOrmTrainerTimeOffRepository,
    },
  ],
  exports: [TrainerAvailabilityRepositoryToken, TrainerTimeOffRepositoryToken],
})
export class TrainerSchedulingModule {}
