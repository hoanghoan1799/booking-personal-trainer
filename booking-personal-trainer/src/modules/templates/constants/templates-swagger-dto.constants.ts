import type { ApiPropertyOptions } from '@nestjs/swagger';

type SwaggerDtoClass = new (...args: unknown[]) => unknown;

import { TemplateType } from '../enums/template-type.enum';

export const TemplatesDtoSwagger = {
  CreateTemplate: {
    ApiProperty: {
      Name: { description: 'Template name' },
      TemplateType: { description: 'Template type', enum: TemplateType },
    } satisfies Record<string, ApiPropertyOptions>,
    ApiPropertyOptional: {
      Description: { description: 'Template description' },
      ParentTemplateId: { description: 'Parent template id', nullable: true },
    } satisfies Record<string, ApiPropertyOptions>,
  },
  UpdateTemplate: {
    ApiPropertyOptional: {
      Name: { description: 'Template name' },
      Description: { description: 'Template description' },
      TemplateType: { description: 'Template type', enum: TemplateType },
      ParentTemplateId: { description: 'Parent template id', nullable: true },
    } satisfies Record<string, ApiPropertyOptions>,
  },
  TemplatesQuery: {
    ApiPropertyOptional: {
      Page: { description: 'Page (1-based)', default: 1 },
      Limit: { description: 'Limit', default: 20 },
      TemplateType: {
        description: 'Filter by template type',
        enum: TemplateType,
      },
      CreatedById: {
        description: 'Filter by createdBy (admin only)',
        format: 'uuid',
      },
      IncludeDeleted: {
        description: 'Include deleted templates',
        default: false,
      },
    } satisfies Record<string, ApiPropertyOptions>,
  },
  CreateTemplateItem: {
    ApiProperty: {
      ExerciseId: { description: 'Exercise id', format: 'uuid' },
      Order: { description: 'Order (1-based)' },
    } satisfies Record<string, ApiPropertyOptions>,
    ApiPropertyOptional: {
      Sets: { description: 'Sets', nullable: true },
      Reps: { description: 'Reps', nullable: true },
      RestSeconds: { description: 'Rest seconds', nullable: true },
      Notes: { description: 'Notes' },
    } satisfies Record<string, ApiPropertyOptions>,
  },
  UpdateTemplateItem: {
    ApiPropertyOptional: {
      ExerciseId: { description: 'Exercise id', format: 'uuid' },
      Order: { description: 'Order (1-based)' },
      Sets: { description: 'Sets', nullable: true },
      Reps: { description: 'Reps', nullable: true },
      RestSeconds: { description: 'Rest seconds', nullable: true },
      Notes: { description: 'Notes' },
    } satisfies Record<string, ApiPropertyOptions>,
  },
  TemplateItemResponse: {
    ApiProperty: {
      Id: { description: 'Template item id', format: 'uuid' },
      TemplateId: { description: 'Template id', format: 'uuid' },
      ExerciseId: { description: 'Exercise id', format: 'uuid' },
      Order: { description: 'Order' },
    } satisfies Record<string, ApiPropertyOptions>,
    ApiPropertyOptional: {
      Sets: { description: 'Sets', nullable: true },
      Reps: { description: 'Reps', nullable: true },
      RestSeconds: { description: 'Rest seconds', nullable: true },
      Notes: { description: 'Notes' },
      CreatedAtIso: { description: 'Created at (ISO)' },
      UpdatedAtIso: { description: 'Updated at (ISO)' },
    } satisfies Record<string, ApiPropertyOptions>,
  },
  TemplateResponse: {
    ApiProperty: {
      Id: { description: 'Template id', format: 'uuid' },
      Name: { description: 'Template name' },
      CreatedBy: { description: 'Created by user id', format: 'uuid' },
      TemplateType: { description: 'Template type', enum: TemplateType },
      IsDeleted: { description: 'Is deleted' },
      Items: <T extends SwaggerDtoClass>(
        templateItemResponseDto: T,
      ): ApiPropertyOptions => ({
        description: 'Items',
        type: [templateItemResponseDto],
      }),
    },
    ApiPropertyOptional: {
      Description: { description: 'Template description' },
      ParentTemplateId: { description: 'Parent template id', nullable: true },
      DeletedAtIso: { description: 'Deleted at (ISO)', nullable: true },
      CreatedAtIso: { description: 'Created at (ISO)' },
      UpdatedAtIso: { description: 'Updated at (ISO)' },
    } satisfies Record<string, ApiPropertyOptions>,
  },
  ImportTemplatesCsvResponse: {
    ApiProperty: {
      TotalRows: { description: 'Total CSV rows processed (excluding header)' },
      CreatedTemplates: { description: 'Created templates count' },
      CreatedItems: { description: 'Created template items count' },
      CreatedTemplateIds: {
        description: 'Created template ids',
        type: [String],
      },
    } satisfies Record<string, ApiPropertyOptions>,
  },
} as const;
