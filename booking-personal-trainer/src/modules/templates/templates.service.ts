import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { NotFoundException } from '@nestjs/common';

// Commons
import { utcNowAsDate } from '../../common/utils/date-time/utc-date-time.helper';

// Enums
import { UserRole } from '../../common/enums/user/user.enum';

// Entities
import { ExerciseTemplate } from './entities/exercise-template.entity';
import { ExerciseTemplateItem } from './entities/exercise-template-item.entity';

// Repositories
import {
  TemplatesRepositoryToken,
  type TemplatesRepository,
  type TemplateFindManyFilter,
} from './repositories/templates.repository.interface';

// DTOs
import { CreateTemplateDto } from './dtos/create-template.dto';
import { UpdateTemplateDto } from './dtos/update-template.dto';
import { CreateTemplateItemDto } from './dtos/create-template-item.dto';
import { UpdateTemplateItemDto } from './dtos/update-template-item.dto';
import { TemplatesQueryDto } from './dtos/templates-query.dto';

// Models
import {
  ExerciseTemplateItemResponseDto,
  ExerciseTemplateResponseDto,
} from './dtos/template-response.dto';
import { ImportTemplatesCsvResponseDto } from './dtos/import-templates-csv-response.dto';
import { parseCsv } from './utils/csv/parse-csv';
import { TemplateType } from './enums/template-type.enum';

@Injectable()
export class TemplatesService {
  constructor(
    @Inject(TemplatesRepositoryToken)
    private readonly templatesRepository: TemplatesRepository,
  ) {}

  async getAll(
    query: TemplatesQueryDto,
    currentUser: { id: string; role: UserRole },
  ): Promise<{
    data: ExerciseTemplateResponseDto[];
    meta: {
      page: number;
      limit: number;
      totalItems: number;
      totalPages: number;
    };
  }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const offset = (page - 1) * limit;
    const filter: TemplateFindManyFilter = {
      isDeleted: query.includeDeleted ? undefined : false,
    };
    if (query.templateType != null) {
      filter.templateType = query.templateType;
    }
    if (query.createdById != null && currentUser.role === UserRole.ADMIN) {
      filter.createdById = query.createdById;
    }
    if (currentUser.role === UserRole.TRAINER) {
      filter.visibleForTrainerId = currentUser.id;
    }
    const [templates, totalItems] =
      await this.templatesRepository.findTemplatesAndCount(filter, {
        limit,
        offset,
        orderBy: { createdAt: 'desc' },
      });
    const data = templates.map((t) => this.mapTemplateToResponseDto(t));
    return {
      data,
      meta: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
      },
    };
  }

  async getOne(id: string): Promise<ExerciseTemplateResponseDto> {
    const template = await this.templatesRepository.findTemplateById(id);
    if (!template || template.isDeleted) {
      throw new NotFoundException('Template not found');
    }
    return this.mapTemplateToResponseDto(template);
  }

  async create(
    dto: CreateTemplateDto,
    currentUser: { id: string },
  ): Promise<ExerciseTemplateResponseDto> {
    const template = await this.templatesRepository.createTemplate({
      name: dto.name,
      description: dto.description ?? '',
      createdById: currentUser.id,
      templateType: dto.templateType,
      parentTemplateId: dto.parentTemplateId ?? null,
    });
    const reloaded = await this.templatesRepository.findTemplateById(
      template.id,
    );
    if (!reloaded) {
      throw new NotFoundException('Template not found');
    }
    return this.mapTemplateToResponseDto(reloaded);
  }

  async fork(
    templateId: string,
    currentUser: { id: string; role: UserRole },
  ): Promise<ExerciseTemplateResponseDto> {
    if (
      currentUser.role !== UserRole.ADMIN &&
      currentUser.role !== UserRole.TRAINER
    ) {
      throw new BadRequestException('Forbidden');
    }
    const existing =
      await this.templatesRepository.findTemplateById(templateId);
    if (!existing || existing.isDeleted) {
      throw new NotFoundException('Template not found');
    }
    if (
      existing.templateType === TemplateType.TRAINER &&
      existing.createdBy.id === currentUser.id
    ) {
      throw new BadRequestException('Cannot fork your own trainer template');
    }
    const forked = await this.templatesRepository.forkTemplate({
      sourceTemplateId: templateId,
      createdById: currentUser.id,
    });
    return this.mapTemplateToResponseDto(forked);
  }

  async update(
    templateId: string,
    dto: UpdateTemplateDto,
    currentUser: { id: string; role: UserRole },
  ): Promise<ExerciseTemplateResponseDto> {
    const existing =
      await this.templatesRepository.findTemplateById(templateId);
    if (!existing || existing.isDeleted) {
      throw new NotFoundException('Template not found');
    }
    const isAdmin = currentUser.role === UserRole.ADMIN;
    const isOwner = existing.createdBy.id === currentUser.id;
    if (!isAdmin && !isOwner) {
      throw new BadRequestException('Cannot update template you do not own');
    }
    await this.templatesRepository.updateTemplate(templateId, {
      name: dto.name,
      description: dto.description,
      templateType: dto.templateType,
      parentTemplateId: dto.parentTemplateId,
    });
    const updated = await this.templatesRepository.findTemplateById(templateId);
    if (!updated) {
      throw new NotFoundException('Template not found');
    }
    return this.mapTemplateToResponseDto(updated);
  }

  async delete(
    templateId: string,
    currentUser: { id: string; role: UserRole },
  ): Promise<void> {
    const existing =
      await this.templatesRepository.findTemplateById(templateId);
    if (!existing || existing.isDeleted) {
      throw new NotFoundException('Template not found');
    }
    const isAdmin = currentUser.role === UserRole.ADMIN;
    const isOwner = existing.createdBy.id === currentUser.id;
    if (!isAdmin && !isOwner) {
      throw new BadRequestException('Cannot delete template you do not own');
    }
    const deleted =
      await this.templatesRepository.softDeleteTemplate(templateId);
    if (!deleted) {
      throw new NotFoundException('Template not found');
    }
  }

  async createItem(
    templateId: string,
    dto: CreateTemplateItemDto,
    currentUser: { id: string; role: UserRole },
  ): Promise<ExerciseTemplateItemResponseDto> {
    const template =
      await this.templatesRepository.findTemplateById(templateId);
    if (!template || template.isDeleted) {
      throw new NotFoundException('Template not found');
    }
    const isAdmin = currentUser.role === UserRole.ADMIN;
    const isOwner = template.createdBy.id === currentUser.id;
    if (!isAdmin && !isOwner) {
      throw new BadRequestException('Cannot edit template you do not own');
    }
    const item = await this.templatesRepository.createTemplateItem({
      templateId,
      exerciseId: dto.exerciseId,
      order: dto.order,
      sets: dto.sets ?? null,
      reps: dto.reps ?? null,
      restSeconds: dto.restSeconds ?? null,
      notes: dto.notes ?? '',
    });
    const reloaded = await this.templatesRepository.findTemplateItemById(
      item.id,
    );
    if (!reloaded) {
      throw new NotFoundException('Template item not found');
    }
    return this.mapItemToResponseDto(reloaded);
  }

  async updateItem(
    templateId: string,
    itemId: string,
    dto: UpdateTemplateItemDto,
    currentUser: { id: string; role: UserRole },
  ): Promise<ExerciseTemplateItemResponseDto> {
    const item = await this.templatesRepository.findTemplateItemById(itemId);
    if (!item || item.template.id !== templateId) {
      throw new NotFoundException('Template item not found');
    }
    const template =
      await this.templatesRepository.findTemplateById(templateId);
    if (!template || template.isDeleted) {
      throw new NotFoundException('Template not found');
    }
    const isAdmin = currentUser.role === UserRole.ADMIN;
    const isOwner = template.createdBy.id === currentUser.id;
    if (!isAdmin && !isOwner) {
      throw new BadRequestException('Cannot edit template you do not own');
    }
    await this.templatesRepository.updateTemplateItem(itemId, {
      exerciseId: dto.exerciseId,
      order: dto.order,
      sets: dto.sets,
      reps: dto.reps,
      restSeconds: dto.restSeconds,
      notes: dto.notes,
    });
    const updated = await this.templatesRepository.findTemplateItemById(itemId);
    if (!updated) {
      throw new NotFoundException('Template item not found');
    }
    return this.mapItemToResponseDto(updated);
  }

  async deleteItem(
    templateId: string,
    itemId: string,
    currentUser: { id: string; role: UserRole },
  ): Promise<void> {
    const item = await this.templatesRepository.findTemplateItemById(itemId);
    if (!item || item.template.id !== templateId) {
      throw new NotFoundException('Template item not found');
    }
    const template =
      await this.templatesRepository.findTemplateById(templateId);
    if (!template || template.isDeleted) {
      throw new NotFoundException('Template not found');
    }
    const isAdmin = currentUser.role === UserRole.ADMIN;
    const isOwner = template.createdBy.id === currentUser.id;
    if (!isAdmin && !isOwner) {
      throw new BadRequestException('Cannot edit template you do not own');
    }
    const deleted = await this.templatesRepository.deleteTemplateItem(itemId);
    if (!deleted) {
      throw new NotFoundException('Template item not found');
    }
  }

  async importFromCsv(
    csvText: string,
    currentUser: { id: string; role: UserRole },
  ): Promise<ImportTemplatesCsvResponseDto> {
    if (
      currentUser.role !== UserRole.ADMIN &&
      currentUser.role !== UserRole.TRAINER
    ) {
      throw new BadRequestException('Forbidden');
    }
    const rows = parseCsv(csvText);
    if (rows.length === 0) {
      throw new BadRequestException('CSV is empty');
    }
    const createdTemplateIds: string[] = [];
    let createdTemplates = 0;
    let createdItems = 0;
    const templateIdByKey = new Map<string, string>();
    const nextOrderByTemplateId = new Map<string, number>();
    for (const row of rows) {
      const name = (row.valuesByHeader.name ?? '').trim();
      if (name === '') {
        throw new BadRequestException(`Row ${row.rowNumber}: name is required`);
      }
      const description = (row.valuesByHeader.description ?? '').trim();
      const templateTypeRaw = (row.valuesByHeader.templateType ?? '').trim();
      const templateType =
        templateTypeRaw === ''
          ? TemplateType.TRAINER
          : (templateTypeRaw as TemplateType);
      if (!Object.values(TemplateType).includes(templateType)) {
        throw new BadRequestException(
          `Row ${row.rowNumber}: templateType must be SYSTEM|TRAINER|PUBLIC`,
        );
      }
      const templateKey = `${templateType}|${name}`;
      let templateId = templateIdByKey.get(templateKey);
      if (!templateId) {
        const created = await this.templatesRepository.createTemplate({
          name,
          description,
          createdById: currentUser.id,
          templateType,
          parentTemplateId: null,
        });
        templateId = created.id;
        templateIdByKey.set(templateKey, templateId);
        createdTemplateIds.push(templateId);
        createdTemplates += 1;
        nextOrderByTemplateId.set(templateId, 1);
      }
      const exerciseId = (row.valuesByHeader.exerciseId ?? '').trim();
      if (exerciseId === '') {
        continue;
      }
      const parsedOrderRaw = (row.valuesByHeader.order ?? '').trim();
      const nextOrder = nextOrderByTemplateId.get(templateId) ?? 1;
      const order =
        parsedOrderRaw === '' ? nextOrder : Number.parseInt(parsedOrderRaw, 10);
      if (!Number.isFinite(order) || order < 1) {
        throw new BadRequestException(
          `Row ${row.rowNumber}: order must be >= 1`,
        );
      }
      nextOrderByTemplateId.set(templateId, Math.max(nextOrder, order + 1));
      const parseNullableInt = (raw: string): number | null => {
        const value = raw.trim();
        if (value === '') return null;
        const parsed = Number.parseInt(value, 10);
        if (!Number.isFinite(parsed) || parsed < 0) {
          throw new BadRequestException(
            `Row ${row.rowNumber}: numeric fields must be >= 0`,
          );
        }
        return parsed;
      };
      const sets = parseNullableInt(row.valuesByHeader.sets ?? '');
      const reps = parseNullableInt(row.valuesByHeader.reps ?? '');
      const restSeconds = parseNullableInt(
        row.valuesByHeader.restSeconds ?? '',
      );
      const notes = (row.valuesByHeader.notes ?? '').trim();
      await this.templatesRepository.createTemplateItem({
        templateId,
        exerciseId,
        order,
        sets,
        reps,
        restSeconds,
        notes,
      });
      createdItems += 1;
    }
    return {
      totalRows: rows.length,
      createdTemplates,
      createdItems,
      createdTemplateIds,
    };
  }

  private mapTemplateToResponseDto(
    template: ExerciseTemplate,
  ): ExerciseTemplateResponseDto {
    const items = template.items.getItems();
    return {
      id: template.id,
      name: template.name,
      description: template.description,
      createdBy: template.createdBy.id,
      templateType: template.templateType,
      parentTemplateId: template.parentTemplate?.id ?? null,
      isDeleted: template.isDeleted ?? false,
      deletedAtIso: template.deletedAt ?? null,
      createdAtIso: template.createdAt ?? utcNowAsDate(),
      updatedAtIso: template.updatedAt ?? utcNowAsDate(),
      items: items
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((item) => this.mapItemToResponseDto(item)),
    };
  }

  private mapItemToResponseDto(
    item: ExerciseTemplateItem,
  ): ExerciseTemplateItemResponseDto {
    return {
      id: item.id,
      templateId: item.template.id,
      exerciseId: item.exercise.id,
      order: item.order,
      sets: item.sets,
      reps: item.reps,
      restSeconds: item.restSeconds,
      notes: item.notes,
      createdAtIso: item.createdAt ?? utcNowAsDate(),
      updatedAtIso: item.updatedAt ?? utcNowAsDate(),
    };
  }
}
