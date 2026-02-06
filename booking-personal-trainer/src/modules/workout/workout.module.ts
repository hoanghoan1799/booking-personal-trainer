import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';

// Entities
import { Workout } from './entities/workout.entity';
import { User } from '../user/entities/user.entity';

// Services
import { WorkoutService } from './workout.service';

// Controllers
import { WorkoutController } from './workout.controller';
import { UserModule } from '../user/user.module';
import { Exercise } from '../exercise/entities/exercise.entity';
import { WorkoutExercise } from './entities/workout-exercise.entity';
import { ExerciseModule } from '../exercise/exercise.module';

@Module({
  imports: [
    ExerciseModule,
    UserModule,
    MikroOrmModule.forFeature([Workout, WorkoutExercise, User, Exercise]),
  ],
  controllers: [WorkoutController],
  providers: [WorkoutService],
})
export class WorkoutModule {}
