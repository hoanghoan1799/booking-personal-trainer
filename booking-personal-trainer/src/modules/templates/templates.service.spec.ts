import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';

// Enums
import { UserRole } from '../../common/enums/user/user.enum';
import { TemplateType } from './enums/template-type.enum';

// Services
import { TemplatesService } from './templates.service';

// Repositories
import { TemplatesRepositoryToken } from './repositories/templates.repository.interface';

const createItemsCollection = <T>(items: T[]): { getItems: () => T[] } => ({
  getItems: () => items,
});

describe('TemplatesService', () => {
  let service: TemplatesService;
  let templatesRepository: {
    createTemplate: jest.Mock;
    findTemplateById: jest.Mock;
    findTemplatesAndCount: jest.Mock;
    updateTemplate: jest.Mock;
    softDeleteTemplate: jest.Mock;
    createTemplateItem: jest.Mock;
    findTemplateItemById: jest.Mock;
    updateTemplateItem: jest.Mock;
    deleteTemplateItem: jest.Mock;
  };

  beforeEach(async () => {
    templatesRepository = {
      createTemplate: jest.fn(),
      findTemplateById: jest.fn(),
      findTemplatesAndCount: jest.fn(),
      updateTemplate: jest.fn(),
      softDeleteTemplate: jest.fn(),
      createTemplateItem: jest.fn(),
      findTemplateItemById: jest.fn(),
      updateTemplateItem: jest.fn(),
      deleteTemplateItem: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TemplatesService,
        {
          provide: TemplatesRepositoryToken,
          useValue: templatesRepository,
        },
      ],
    }).compile();

    service = module.get<TemplatesService>(TemplatesService);
  });

  describe('getAll', () => {
    it('should scope to trainer templates when role is TRAINER', async () => {
      templatesRepository.findTemplatesAndCount.mockResolvedValue([[], 0]);

      await service.getAll(
        { page: 1, limit: 20 },
        { id: 'trainer-id', role: UserRole.TRAINER },
      );

      expect(templatesRepository.findTemplatesAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ createdById: 'trainer-id' }),
        expect.any(Object),
      );
    });
  });

  describe('getOne', () => {
    it('should throw NotFoundException when template missing', async () => {
      templatesRepository.findTemplateById.mockResolvedValue(null);

      await expect(service.getOne('missing')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('should create template with createdBy from current user', async () => {
      templatesRepository.createTemplate.mockResolvedValue({ id: 't1' });
      templatesRepository.findTemplateById.mockResolvedValue({
        id: 't1',
        name: 'Leg day',
        description: '',
        createdBy: { id: 'trainer-id' },
        templateType: TemplateType.TRAINER,
        parentTemplate: null,
        isDeleted: false,
        deletedAt: null,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
        items: createItemsCollection([]),
      });

      const actual = await service.create(
        { name: 'Leg day', templateType: TemplateType.TRAINER },
        { id: 'trainer-id' },
      );

      expect(templatesRepository.createTemplate).toHaveBeenCalledWith(
        expect.objectContaining({ createdById: 'trainer-id', name: 'Leg day' }),
      );
      expect(actual.id).toBe('t1');
      expect(actual.createdBy).toBe('trainer-id');
    });
  });

  describe('update', () => {
    it('should block update when trainer is not owner', async () => {
      templatesRepository.findTemplateById.mockResolvedValue({
        id: 't1',
        createdBy: { id: 'other-trainer' },
        items: createItemsCollection([]),
        isDeleted: false,
      });

      await expect(
        service.update(
          't1',
          { name: 'New name' },
          { id: 'trainer-id', role: UserRole.TRAINER },
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('importFromCsv', () => {
    it('should throw when CSV has empty name', async () => {
      await expect(
        service.importFromCsv('name,templateType\n,TRAINER\n', {
          id: 'trainer-id',
          role: UserRole.TRAINER,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should create templates and items from CSV', async () => {
      templatesRepository.createTemplate.mockResolvedValue({ id: 't1' });
      templatesRepository.createTemplateItem.mockResolvedValue({ id: 'i1' });

      const actual = await service.importFromCsv(
        [
          'name,description,templateType,exerciseId,sets,reps,restSeconds,order,notes',
          'Leg day,,TRAINER,exercise-uuid,3,10,60,1,""',
        ].join('\n'),
        { id: 'trainer-id', role: UserRole.TRAINER },
      );

      expect(templatesRepository.createTemplate).toHaveBeenCalledTimes(1);
      expect(templatesRepository.createTemplateItem).toHaveBeenCalledTimes(1);
      expect(actual.createdTemplates).toBe(1);
      expect(actual.createdItems).toBe(1);
      expect(actual.createdTemplateIds).toEqual(['t1']);
    });
  });
});
