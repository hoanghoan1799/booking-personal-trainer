import { HttpStatus } from '@nestjs/common';
import { getSchemaPath } from '@nestjs/swagger';
import type { ApiBodyOptions, ApiResponseOptions } from '@nestjs/swagger';

import { CreateTemplateDto } from '../dtos/create-template.dto';
import { CreateTemplateItemDto } from '../dtos/create-template-item.dto';
import { ImportTemplatesCsvResponseDto } from '../dtos/import-templates-csv-response.dto';
import {
  ExerciseTemplateItemResponseDto,
  ExerciseTemplateResponseDto,
} from '../dtos/template-response.dto';
import { UpdateTemplateDto } from '../dtos/update-template.dto';
import { UpdateTemplateItemDto } from '../dtos/update-template-item.dto';

import { TemplatesDtoSwagger } from './templates-swagger-dto.constants';

export const TemplatesSwagger = {
  Controller: {
    ApiOperation: {
      List: { summary: 'List templates' },
      ImportCsv: { summary: 'Import templates from CSV' },
      GetOne: { summary: 'Get template by id' },
      Create: { summary: 'Create template' },
      Fork: { summary: 'Fork template into a trainer template' },
      Update: { summary: 'Update template' },
      Delete: { summary: 'Delete template (soft delete)' },
      CreateItem: { summary: 'Create template item' },
      UpdateItem: { summary: 'Update template item' },
      DeleteItem: { summary: 'Delete template item' },
    },
    ApiConsumes: {
      Multipart: 'multipart/form-data',
    },
    ApiParam: {
      TemplateId: { name: 'templateId', type: String },
      ItemId: { name: 'itemId', type: String },
    },
    ApiBody: {
      Create: { type: CreateTemplateDto },
      Update: { type: UpdateTemplateDto },
      CreateItem: { type: CreateTemplateItemDto },
      UpdateItem: { type: UpdateTemplateItemDto },
      ImportCsv: {
        schema: {
          type: 'object',
          properties: {
            file: { type: 'string', format: 'binary' },
          },
          required: ['file'],
        },
      } satisfies ApiBodyOptions,
    },
    ApiResponse: {
      ListOk: {
        status: HttpStatus.OK,
        schema: {
          required: ['data', 'meta'],
          properties: {
            data: {
              type: 'array',
              items: { $ref: getSchemaPath(ExerciseTemplateResponseDto) },
            },
            meta: { type: 'object' },
          },
        },
      },
      ImportCsvOk: {
        status: HttpStatus.OK,
        schema: {
          required: ['data'],
          properties: {
            data: { $ref: getSchemaPath(ImportTemplatesCsvResponseDto) },
          },
        },
      },
      DeleteOk: {
        status: HttpStatus.OK,
        schema: { properties: { message: { type: 'string' } } },
      },
      DeleteItemOk: {
        status: HttpStatus.OK,
        schema: { properties: { message: { type: 'string' } } },
      },
    } satisfies Record<string, ApiResponseOptions>,
    ApiExtraModels: {
      Template: ExerciseTemplateResponseDto,
      TemplateItem: ExerciseTemplateItemResponseDto,
      ImportCsvResponse: ImportTemplatesCsvResponseDto,
    },
  },
  Dto: { ...TemplatesDtoSwagger },
} as const;
