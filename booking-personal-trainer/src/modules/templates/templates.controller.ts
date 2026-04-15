import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { BadRequestException } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiExtraModels,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadedFile } from '@nestjs/common';
import type { Buffer } from 'node:buffer';

// Commons
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { SWAGGER_ACCESS_TOKEN } from '../../common/constants/api-document.constants';
import { Roles } from '../../common/decorators/role.decorator';
import { UserRole } from '../../common/enums/user/user.enum';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { BaseResponseDto } from '../../common/dtos/base-response.dto';
import { Serialize } from '../../common/decorators/serialize.decorator';

// Types
import type { JwtAuthPayload } from '../auth/types/jwt-auth.type';

// Services
import { TemplatesService } from './templates.service';

// DTOs
import { CreateTemplateDto } from './dtos/create-template.dto';
import { UpdateTemplateDto } from './dtos/update-template.dto';
import { TemplatesQueryDto } from './dtos/templates-query.dto';
import { CreateTemplateItemDto } from './dtos/create-template-item.dto';
import { UpdateTemplateItemDto } from './dtos/update-template-item.dto';
import {
  ExerciseTemplateItemResponseDto,
  ExerciseTemplateResponseDto,
} from './dtos/template-response.dto';
import { ImportTemplatesCsvResponseDto } from './dtos/import-templates-csv-response.dto';

@ApiTags('Templates')
@ApiBearerAuth(SWAGGER_ACCESS_TOKEN)
@ApiExtraModels(
  ExerciseTemplateResponseDto,
  ExerciseTemplateItemResponseDto,
  ImportTemplatesCsvResponseDto,
)
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('templates')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Roles(UserRole.ADMIN, UserRole.TRAINER)
  @Get()
  @Serialize(ExerciseTemplateResponseDto)
  @ApiOperation({ summary: 'List templates' })
  @ApiResponse({
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
  })
  async list(
    @Query() query: TemplatesQueryDto,
    @CurrentUser() currentUser: JwtAuthPayload,
  ): Promise<BaseResponseDto<ExerciseTemplateResponseDto[]>> {
    const result = await this.templatesService.getAll(query, currentUser);
    return BaseResponseDto.okWithPagination(result.data, {
      page: result.meta.page,
      limit: result.meta.limit,
      totalItems: result.meta.totalItems,
    });
  }

  @Roles(UserRole.ADMIN, UserRole.TRAINER)
  @Post('import/csv')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Import templates from CSV' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
      required: ['file'],
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    schema: {
      required: ['data'],
      properties: {
        data: { $ref: getSchemaPath(ImportTemplatesCsvResponseDto) },
      },
    },
  })
  async importCsv(
    @UploadedFile() file: { buffer: Buffer } | undefined,
    @CurrentUser() currentUser: JwtAuthPayload,
  ): Promise<BaseResponseDto<ImportTemplatesCsvResponseDto>> {
    if (!file || !file.buffer) {
      throw new BadRequestException('file is required');
    }
    const csvText = file.buffer.toString('utf-8');
    const result = await this.templatesService.importFromCsv(
      csvText,
      currentUser,
    );
    return BaseResponseDto.ok(result);
  }

  @Roles(UserRole.ADMIN, UserRole.TRAINER)
  @Get(':templateId')
  @Serialize(ExerciseTemplateResponseDto)
  @ApiOperation({ summary: 'Get template by id' })
  @ApiParam({ name: 'templateId', type: String })
  async getOne(
    @Param('templateId') templateId: string,
  ): Promise<BaseResponseDto<ExerciseTemplateResponseDto>> {
    const template = await this.templatesService.getOne(templateId);
    return BaseResponseDto.ok(template);
  }

  @Roles(UserRole.ADMIN, UserRole.TRAINER)
  @Post()
  @Serialize(ExerciseTemplateResponseDto)
  @ApiOperation({ summary: 'Create template' })
  @ApiBody({ type: CreateTemplateDto })
  async create(
    @Body() body: CreateTemplateDto,
    @CurrentUser() currentUser: JwtAuthPayload,
  ): Promise<BaseResponseDto<ExerciseTemplateResponseDto>> {
    const template = await this.templatesService.create(body, currentUser);
    return BaseResponseDto.ok(template);
  }

  @Roles(UserRole.ADMIN, UserRole.TRAINER)
  @Post(':templateId/fork')
  @Serialize(ExerciseTemplateResponseDto)
  @ApiOperation({ summary: 'Fork template into a trainer template' })
  @ApiParam({ name: 'templateId', type: String })
  async fork(
    @Param('templateId') templateId: string,
    @CurrentUser() currentUser: JwtAuthPayload,
  ): Promise<BaseResponseDto<ExerciseTemplateResponseDto>> {
    const template = await this.templatesService.fork(templateId, currentUser);
    return BaseResponseDto.ok(template);
  }

  @Roles(UserRole.ADMIN, UserRole.TRAINER)
  @Patch(':templateId')
  @Serialize(ExerciseTemplateResponseDto)
  @ApiOperation({ summary: 'Update template' })
  @ApiParam({ name: 'templateId', type: String })
  @ApiBody({ type: UpdateTemplateDto })
  async update(
    @Param('templateId') templateId: string,
    @Body() body: UpdateTemplateDto,
    @CurrentUser() currentUser: JwtAuthPayload,
  ): Promise<BaseResponseDto<ExerciseTemplateResponseDto>> {
    const template = await this.templatesService.update(
      templateId,
      body,
      currentUser,
    );
    return BaseResponseDto.ok(template);
  }

  @Roles(UserRole.ADMIN, UserRole.TRAINER)
  @Delete(':templateId')
  @ApiOperation({ summary: 'Delete template (soft delete)' })
  @ApiParam({ name: 'templateId', type: String })
  @ApiResponse({
    status: HttpStatus.OK,
    schema: { properties: { message: { type: 'string' } } },
  })
  async remove(
    @Param('templateId') templateId: string,
    @CurrentUser() currentUser: JwtAuthPayload,
  ): Promise<BaseResponseDto<{ message: string }>> {
    await this.templatesService.delete(templateId, currentUser);
    return BaseResponseDto.ok({ message: 'Template deleted' });
  }

  @Roles(UserRole.ADMIN, UserRole.TRAINER)
  @Post(':templateId/items')
  @Serialize(ExerciseTemplateItemResponseDto)
  @ApiOperation({ summary: 'Create template item' })
  @ApiParam({ name: 'templateId', type: String })
  @ApiBody({ type: CreateTemplateItemDto })
  async createItem(
    @Param('templateId') templateId: string,
    @Body() body: CreateTemplateItemDto,
    @CurrentUser() currentUser: JwtAuthPayload,
  ): Promise<BaseResponseDto<ExerciseTemplateItemResponseDto>> {
    const item = await this.templatesService.createItem(
      templateId,
      body,
      currentUser,
    );
    return BaseResponseDto.ok(item);
  }

  @Roles(UserRole.ADMIN, UserRole.TRAINER)
  @Patch(':templateId/items/:itemId')
  @Serialize(ExerciseTemplateItemResponseDto)
  @ApiOperation({ summary: 'Update template item' })
  @ApiParam({ name: 'templateId', type: String })
  @ApiParam({ name: 'itemId', type: String })
  @ApiBody({ type: UpdateTemplateItemDto })
  async updateItem(
    @Param('templateId') templateId: string,
    @Param('itemId') itemId: string,
    @Body() body: UpdateTemplateItemDto,
    @CurrentUser() currentUser: JwtAuthPayload,
  ): Promise<BaseResponseDto<ExerciseTemplateItemResponseDto>> {
    const item = await this.templatesService.updateItem(
      templateId,
      itemId,
      body,
      currentUser,
    );
    return BaseResponseDto.ok(item);
  }

  @Roles(UserRole.ADMIN, UserRole.TRAINER)
  @Delete(':templateId/items/:itemId')
  @ApiOperation({ summary: 'Delete template item' })
  @ApiParam({ name: 'templateId', type: String })
  @ApiParam({ name: 'itemId', type: String })
  @ApiResponse({
    status: HttpStatus.OK,
    schema: { properties: { message: { type: 'string' } } },
  })
  async removeItem(
    @Param('templateId') templateId: string,
    @Param('itemId') itemId: string,
    @CurrentUser() currentUser: JwtAuthPayload,
  ): Promise<BaseResponseDto<{ message: string }>> {
    await this.templatesService.deleteItem(templateId, itemId, currentUser);
    return BaseResponseDto.ok({ message: 'Template item deleted' });
  }
}
