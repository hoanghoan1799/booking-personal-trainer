import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';

// Entities
import { Workout } from './entities/workout.entity';
import { WorkoutExercise } from './entities/workout-exercise.entity';
import { User } from '../user/entities/user.entity';
import { Exercise } from '../exercise/entities/exercise.entity';

// Services
import { WorkoutService } from './workout.service';

// Controllers
import { WorkoutController } from './workout.controller';

// Repositories
import { WorkoutRepositoryToken } from './repositories/workout.repository.interface';
import { MikroOrmWorkoutRepository } from './repositories/mikroorm-workout.repository';

// Modules
import { UserModule } from '../user/user.module';
import { ExerciseModule } from '../exercise/exercise.module';

@Module({
  imports: [
    ExerciseModule,
    UserModule,
    MikroOrmModule.forFeature([Workout, WorkoutExercise, User, Exercise]),
  ],
  controllers: [WorkoutController],
  providers: [
    WorkoutService,
    {
      provide: WorkoutRepositoryToken,
      useClass: MikroOrmWorkoutRepository,
    },
  ],
})
export class WorkoutModule {}
