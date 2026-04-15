import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';

// Controllers
import { TemplatesController } from './templates.controller';

// Services
import { TemplatesService } from './templates.service';

// Entities
import { ExerciseTemplate } from './entities/exercise-template.entity';
import { ExerciseTemplateItem } from './entities/exercise-template-item.entity';

// Repositories
import { TemplatesRepositoryToken } from './repositories/templates.repository.interface';
import { MikroOrmTemplatesRepository } from './repositories/mikroorm-templates.repository';

// Modules
import { ExerciseModule } from '../exercise/exercise.module';

@Module({
  imports: [
    ExerciseModule,
    MikroOrmModule.forFeature([ExerciseTemplate, ExerciseTemplateItem]),
  ],
  controllers: [TemplatesController],
  providers: [
    TemplatesService,
    {
      provide: TemplatesRepositoryToken,
      useClass: MikroOrmTemplatesRepository,
    },
  ],
  exports: [TemplatesRepositoryToken, TemplatesService],
})
export class TemplatesModule {}
