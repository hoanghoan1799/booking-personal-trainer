import { TemplateType } from '../enums/template-type.enum';
import { ExerciseTemplate } from '../entities/exercise-template.entity';
import { ExerciseTemplateItem } from '../entities/exercise-template-item.entity';

/** Injection token for TemplatesRepository */
export const TemplatesRepositoryToken = Symbol('TemplatesRepository');

export interface TemplateFindManyFilter {
  createdById?: string;
  templateType?: TemplateType;
  isDeleted?: boolean;
}

export interface FindManyTemplateOptions {
  limit: number;
  offset: number;
  orderBy: Record<string, 'asc' | 'desc'>;
}

export interface CreateTemplateData {
  name: string;
  description: string;
  createdById: string;
  templateType: TemplateType;
  parentTemplateId: string | null;
}

export interface UpdateTemplateData {
  name?: string;
  description?: string;
  templateType?: TemplateType;
  parentTemplateId?: string | null;
}

export interface CreateTemplateItemData {
  templateId: string;
  exerciseId: string;
  order: number;
  sets: number | null;
  reps: number | null;
  restSeconds: number | null;
  notes: string;
}

export interface UpdateTemplateItemData {
  exerciseId?: string;
  order?: number;
  sets?: number | null;
  reps?: number | null;
  restSeconds?: number | null;
  notes?: string;
}

/**
 * Port for templates persistence. Implement with MikroORM, Prisma, TypeORM, etc.
 */
export interface TemplatesRepository {
  createTemplate(data: CreateTemplateData): Promise<ExerciseTemplate>;
  findTemplateById(id: string): Promise<ExerciseTemplate | null>;
  findTemplatesAndCount(
    filter: TemplateFindManyFilter,
    options: FindManyTemplateOptions,
  ): Promise<[ExerciseTemplate[], number]>;
  updateTemplate(
    id: string,
    data: UpdateTemplateData,
  ): Promise<ExerciseTemplate>;
  softDeleteTemplate(id: string): Promise<boolean>;
  createTemplateItem(
    data: CreateTemplateItemData,
  ): Promise<ExerciseTemplateItem>;
  findTemplateItemById(id: string): Promise<ExerciseTemplateItem | null>;
  updateTemplateItem(
    id: string,
    data: UpdateTemplateItemData,
  ): Promise<ExerciseTemplateItem>;
  deleteTemplateItem(id: string): Promise<boolean>;
}
