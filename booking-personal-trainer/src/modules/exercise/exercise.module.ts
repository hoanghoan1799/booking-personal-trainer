import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';

// Entities
import { Exercise } from './entities/exercise.entity';

// Services
import { ExerciseService } from './exercise.service';

// Controllers
import { ExerciseController } from './exercise.controller';

@Module({
  imports: [MikroOrmModule.forFeature([Exercise])],
  controllers: [ExerciseController],
  providers: [ExerciseService],
  exports: [ExerciseService],
})
export class ExerciseModule {}
