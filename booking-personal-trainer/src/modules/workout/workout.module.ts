import { Module } from '@nestjs/common';
import { WorkoutService } from './workout.service';
import { WorkoutController } from './workout.controller';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Workout } from './entities/workout.entity';

@Module({
  imports: [MikroOrmModule.forFeature([Workout])],

  controllers: [WorkoutController],
  providers: [WorkoutService],
})
export class WorkoutModule {}
