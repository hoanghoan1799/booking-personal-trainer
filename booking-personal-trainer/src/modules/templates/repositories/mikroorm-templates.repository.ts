import { Inject, Injectable } from '@nestjs/common';

import { utcNowIso } from '../../../common/utils/date-time/utc-date-time.helper';
import { EntityManager, EntityRepository, FilterQuery } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { wrap } from '@mikro-orm/core';

// Entities
import { ExerciseTemplate } from '../entities/exercise-template.entity';
import { ExerciseTemplateItem } from '../entities/exercise-template-item.entity';
import { User } from '../../user/entities/user.entity';
import { Exercise } from '../../exercise/entities/exercise.entity';
import { TemplateType } from '../enums/template-type.enum';

// Repositories
import {
  ExerciseRepositoryToken,
  type ExerciseRepository,
} from '../../exercise/repositories/exercise.repository.interface';
import {
  CreateTemplateData,
  CreateTemplateItemData,
  FindManyTemplateOptions,
  TemplateFindManyFilter,
  TemplatesRepository,
  UpdateTemplateData,
  UpdateTemplateItemData,
} from './templates.repository.interface';

@Injectable()
export class MikroOrmTemplatesRepository implements TemplatesRepository {
  constructor(
    @InjectRepository(ExerciseTemplate)
    private readonly templateRepo: EntityRepository<ExerciseTemplate>,
    @InjectRepository(ExerciseTemplateItem)
    private readonly itemRepo: EntityRepository<ExerciseTemplateItem>,
    private readonly em: EntityManager,
    @Inject(ExerciseRepositoryToken)
    private readonly exerciseRepository: ExerciseRepository,
  ) {}

  async createTemplate(data: CreateTemplateData): Promise<ExerciseTemplate> {
    const createdBy = this.em.getReference(User, data.createdById);
    const parentTemplate =
      data.parentTemplateId == null
        ? null
        : this.em.getReference(ExerciseTemplate, data.parentTemplateId);
    const template = this.templateRepo.create({
      name: data.name,
      description: data.description,
      createdBy,
      templateType: data.templateType,
      parentTemplate,
      isDeleted: false,
      deletedAt: null,
    });
    await this.em.persist(template).flush();
    return template;
  }

  async findTemplateById(id: string): Promise<ExerciseTemplate | null> {
    return this.templateRepo.findOne(
      { id },
      { populate: ['createdBy', 'items', 'items.exercise', 'parentTemplate'] },
    );
  }

  async findTemplatesAndCount(
    filter: TemplateFindManyFilter,
    options: FindManyTemplateOptions,
  ): Promise<[ExerciseTemplate[], number]> {
    const where: FilterQuery<ExerciseTemplate> =
      filter.visibleForTrainerId != null
        ? {
            isDeleted: filter.isDeleted ?? false,
            $or: [
              {
                templateType: {
                  $in: [TemplateType.SYSTEM, TemplateType.PUBLIC],
                },
              },
              {
                templateType: TemplateType.TRAINER,
                createdBy: filter.visibleForTrainerId,
              },
            ],
          }
        : {
            isDeleted: filter.isDeleted ?? false,
          };
    if (filter.createdById != null) {
      where.createdBy = filter.createdById;
    }
    if (filter.templateType != null) {
      where.templateType = filter.templateType;
    }
    return this.templateRepo.findAndCount(where, {
      limit: options.limit,
      offset: options.offset,
      orderBy: options.orderBy,
      populate: ['createdBy', 'items', 'items.exercise', 'parentTemplate'],
    });
  }

  async forkTemplate(params: {
    sourceTemplateId: string;
    createdById: string;
  }): Promise<ExerciseTemplate> {
    return this.em.transactional(async (em) => {
      const source = await em.findOne(
        ExerciseTemplate,
        { id: params.sourceTemplateId, isDeleted: false },
        {
          populate: ['items', 'items.exercise', 'createdBy', 'parentTemplate'],
        },
      );
      if (!source) {
        throw new Error('Template not found');
      }
      const createdBy = em.getReference(User, params.createdById);
      const forked = em.create(ExerciseTemplate, {
        name: `${source.name} (Copy)`,
        description: source.description ?? '',
        createdBy,
        templateType: TemplateType.TRAINER,
        parentTemplate: em.getReference(ExerciseTemplate, source.id),
        isDeleted: false,
        deletedAt: null,
      });
      await em.persist(forked).flush();
      const items = source.items
        .getItems()
        .slice()
        .sort((a, b) => a.order - b.order);
      items.forEach((item) => {
        const forkedItem = em.create(ExerciseTemplateItem, {
          template: forked,
          exercise: em.getReference(Exercise, item.exercise.id),
          order: item.order,
          sets: item.sets,
          reps: item.reps,
          restSeconds: item.restSeconds,
          notes: item.notes,
        });
        forked.items.add(forkedItem);
      });
      await em.persist(forked).flush();
      const reloaded = await em.findOne(
        ExerciseTemplate,
        { id: forked.id },
        {
          populate: ['createdBy', 'items', 'items.exercise', 'parentTemplate'],
        },
      );
      if (!reloaded) {
        throw new Error('Template not found');
      }
      return reloaded;
    });
  }

  async updateTemplate(
    id: string,
    data: UpdateTemplateData,
  ): Promise<ExerciseTemplate> {
    const template = await this.templateRepo.findOne({ id, isDeleted: false });
    if (!template) {
      throw new Error('Template not found');
    }
    const parentTemplate =
      data.parentTemplateId === undefined
        ? undefined
        : data.parentTemplateId == null
          ? null
          : this.em.getReference(ExerciseTemplate, data.parentTemplateId);
    wrap(template).assign(
      {
        name: data.name,
        description: data.description,
        templateType: data.templateType,
        parentTemplate,
      },
      { onlyProperties: true },
    );
    await this.em.flush();
    return template;
  }

  async softDeleteTemplate(id: string): Promise<boolean> {
    const template = await this.templateRepo.findOne({ id, isDeleted: false });
    if (!template) {
      return false;
    }
    template.isDeleted = true;
    template.deletedAt = utcNowIso();
    await this.em.flush();
    return true;
  }

  async createTemplateItem(
    data: CreateTemplateItemData,
  ): Promise<ExerciseTemplateItem> {
    return this.em.transactional(async (em) => {
      const template = await em.findOne(ExerciseTemplate, {
        id: data.templateId,
        isDeleted: false,
      });
      if (!template) {
        throw new Error('Template not found');
      }
      const exercises = await this.exerciseRepository.findByIds([
        data.exerciseId,
      ]);
      const exercise = exercises[0];
      if (!exercise) {
        throw new Error('Exercise not found');
      }
      const item = em.create(ExerciseTemplateItem, {
        template,
        exercise: em.getReference(Exercise, exercise.id),
        order: data.order,
        sets: data.sets,
        reps: data.reps,
        restSeconds: data.restSeconds,
        notes: data.notes,
      });
      await em.persist(item).flush();
      return item;
    });
  }

  async findTemplateItemById(id: string): Promise<ExerciseTemplateItem | null> {
    return this.itemRepo.findOne(
      { id },
      { populate: ['template', 'exercise'] },
    );
  }

  async updateTemplateItem(
    id: string,
    data: UpdateTemplateItemData,
  ): Promise<ExerciseTemplateItem> {
    return this.em.transactional(async (em) => {
      const item = await em.findOne(
        ExerciseTemplateItem,
        { id },
        { populate: ['template', 'exercise'] },
      );
      if (!item) {
        throw new Error('Template item not found');
      }
      if (data.exerciseId != null) {
        const exercises = await this.exerciseRepository.findByIds([
          data.exerciseId,
        ]);
        const exercise = exercises[0];
        if (!exercise) {
          throw new Error('Exercise not found');
        }
        item.exercise = em.getReference(Exercise, exercise.id);
      }
      wrap(item).assign(
        {
          order: data.order,
          sets: data.sets,
          reps: data.reps,
          restSeconds: data.restSeconds,
          notes: data.notes,
        },
        { onlyProperties: true },
      );
      await em.flush();
      return item;
    });
  }

  async deleteTemplateItem(id: string): Promise<boolean> {
    const item = await this.itemRepo.findOne({ id });
    if (!item) {
      return false;
    }
    await this.em.remove(item).flush();
    return true;
  }
}
