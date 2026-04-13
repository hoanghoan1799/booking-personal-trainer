import { Inject, Injectable } from '@nestjs/common';
import { EntityManager, EntityRepository, FilterQuery } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { wrap } from '@mikro-orm/core';

// Entities
import { ExerciseTemplate } from '../entities/exercise-template.entity';
import { ExerciseTemplateItem } from '../entities/exercise-template-item.entity';
import { User } from '../../user/entities/user.entity';
import { Exercise } from '../../exercise/entities/exercise.entity';

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
    const where: FilterQuery<ExerciseTemplate> = {
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
    template.deletedAt = new Date().toISOString();
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
