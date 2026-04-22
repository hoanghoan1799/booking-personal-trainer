import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';

// Entities
import { Exercise } from './entities/exercise.entity';

// Services
import { ExerciseService } from './services/exercise.service';

// Controllers
import { ExerciseController } from './controllers/exercise.controller';

// Repositories
import { ExerciseRepositoryToken } from './repositories/exercise.repository.interface';
import { MikroOrmExerciseRepository } from './repositories/mikroorm-exercise.repository';

@Module({
  imports: [MikroOrmModule.forFeature([Exercise])],
  controllers: [ExerciseController],
  providers: [
    ExerciseService,
    {
      provide: ExerciseRepositoryToken,
      useClass: MikroOrmExerciseRepository,
    },
  ],
  exports: [ExerciseService, ExerciseRepositoryToken],
})
export class ExerciseModule {}
