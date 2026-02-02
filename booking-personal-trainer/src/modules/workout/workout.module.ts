import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';

// Entities
import { Workout } from './entities/workout.entity';

// Services
import { WorkoutService } from './workout.service';

// Controllers
import { WorkoutController } from './workout.controller';

@Module({
  imports: [MikroOrmModule.forFeature([Workout])],

  controllers: [WorkoutController],
  providers: [WorkoutService],
})
export class WorkoutModule {}
