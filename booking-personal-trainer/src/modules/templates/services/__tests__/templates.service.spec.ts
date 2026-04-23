import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';

// Enums
import { UserRole } from '../../../../common/enums/user/user.enum';
import { TemplateType } from '../../enums/template-type.enum';

// Services
import { TemplatesService } from '../templates.service';

// Repositories
import { TemplatesRepositoryToken } from '../../repositories/templates.repository.interface';

const createItemsCollection = <T>(items: T[]): { getItems: () => T[] } => ({
  getItems: () => items,
});

describe('TemplatesService', () => {
  let service: TemplatesService;
  let templatesRepository: {
    createTemplate: jest.Mock;
    findTemplateById: jest.Mock;
    findTemplatesAndCount: jest.Mock;
    forkTemplate: jest.Mock;
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
      forkTemplate: jest.fn(),
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
        expect.objectContaining({ visibleForTrainerId: 'trainer-id' }),
        expect.any(Object),
      );
    });

    it('should allow admin filter by createdById and include deleted when requested', async () => {
      templatesRepository.findTemplatesAndCount.mockResolvedValue([[], 0]);

      await service.getAll(
        {
          page: 1,
          limit: 20,
          createdById: 'creator-id',
          includeDeleted: true,
        },
        { id: 'admin-id', role: UserRole.ADMIN },
      );

      expect(templatesRepository.findTemplatesAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          createdById: 'creator-id',
          isDeleted: undefined,
        }),
        expect.any(Object),
      );
    });

    it('should apply templateType filter when provided', async () => {
      templatesRepository.findTemplatesAndCount.mockResolvedValue([[], 0]);

      await service.getAll(
        { page: 1, limit: 20, templateType: TemplateType.SYSTEM },
        { id: 'admin-id', role: UserRole.ADMIN },
      );

      expect(templatesRepository.findTemplatesAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ templateType: TemplateType.SYSTEM }),
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

    it('should return template when exists and not deleted', async () => {
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

      const actual = await service.getOne('t1');

      expect(actual.id).toBe('t1');
      expect(actual.isDeleted).toBe(false);
    });

    it('should sort items by order', async () => {
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
        items: createItemsCollection([
          {
            id: 'i2',
            template: { id: 't1' },
            exercise: { id: 'e2' },
            order: 2,
            sets: null,
            reps: null,
            restSeconds: null,
            notes: '',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: 'i1',
            template: { id: 't1' },
            exercise: { id: 'e1' },
            order: 1,
            sets: null,
            reps: null,
            restSeconds: null,
            notes: '',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ]),
      });

      const actual = await service.getOne('t1');

      expect(actual.items.map((i) => i.id)).toEqual(['i1', 'i2']);
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

    it('should throw when created template cannot be reloaded', async () => {
      templatesRepository.createTemplate.mockResolvedValue({ id: 't1' });
      templatesRepository.findTemplateById.mockResolvedValue(null);

      await expect(
        service.create(
          { name: 'Leg day', templateType: TemplateType.TRAINER },
          { id: 'trainer-id' },
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
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

    it('should update when owner trainer', async () => {
      templatesRepository.findTemplateById
        .mockResolvedValueOnce({
          id: 't1',
          createdBy: { id: 'trainer-id' },
          items: createItemsCollection([]),
          isDeleted: false,
        })
        .mockResolvedValueOnce({
          id: 't1',
          name: 'Updated',
          description: '',
          createdBy: { id: 'trainer-id' },
          templateType: TemplateType.TRAINER,
          parentTemplate: null,
          isDeleted: false,
          deletedAt: null,
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
          updatedAt: new Date('2026-01-02T00:00:00.000Z'),
          items: createItemsCollection([]),
        });

      const actual = await service.update(
        't1',
        { name: 'Updated' },
        { id: 'trainer-id', role: UserRole.TRAINER },
      );

      expect(templatesRepository.updateTemplate).toHaveBeenCalled();
      expect(actual.name).toBe('Updated');
    });

    it('should throw when template missing', async () => {
      templatesRepository.findTemplateById.mockResolvedValue(null);

      await expect(
        service.update(
          't-missing',
          { name: 'Updated' },
          { id: 'trainer-id', role: UserRole.TRAINER },
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should soft delete when owner trainer', async () => {
      templatesRepository.findTemplateById.mockResolvedValue({
        id: 't1',
        createdBy: { id: 'trainer-id' },
        items: createItemsCollection([]),
        isDeleted: false,
      });
      templatesRepository.softDeleteTemplate.mockResolvedValue(true);

      await service.delete('t1', { id: 'trainer-id', role: UserRole.TRAINER });

      expect(templatesRepository.softDeleteTemplate).toHaveBeenCalledWith('t1');
    });

    it('should throw when user is not owner', async () => {
      templatesRepository.findTemplateById.mockResolvedValue({
        id: 't1',
        createdBy: { id: 'owner-id' },
        items: createItemsCollection([]),
        isDeleted: false,
      });

      await expect(
        service.delete('t1', { id: 'trainer-id', role: UserRole.TRAINER }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should throw when soft delete returns false', async () => {
      templatesRepository.findTemplateById.mockResolvedValue({
        id: 't1',
        createdBy: { id: 'trainer-id' },
        items: createItemsCollection([]),
        isDeleted: false,
      });
      templatesRepository.softDeleteTemplate.mockResolvedValue(false);

      await expect(
        service.delete('t1', { id: 'trainer-id', role: UserRole.TRAINER }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('createItem', () => {
    it('should create item and return mapped response', async () => {
      templatesRepository.findTemplateById.mockResolvedValue({
        id: 't1',
        createdBy: { id: 'trainer-id' },
        isDeleted: false,
      });
      templatesRepository.createTemplateItem.mockResolvedValue({ id: 'i1' });
      templatesRepository.findTemplateItemById.mockResolvedValue({
        id: 'i1',
        template: { id: 't1' },
        exercise: { id: 'e1' },
        order: 1,
        sets: 3,
        reps: 10,
        restSeconds: 60,
        notes: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const actual = await service.createItem(
        't1',
        { exerciseId: 'e1', order: 1 },
        { id: 'trainer-id', role: UserRole.TRAINER },
      );

      expect(actual.templateId).toBe('t1');
      expect(actual.exerciseId).toBe('e1');
    });

    it('should throw when template not found', async () => {
      templatesRepository.findTemplateById.mockResolvedValue(null);

      await expect(
        service.createItem(
          't1',
          { exerciseId: 'e1', order: 1 },
          { id: 'trainer-id', role: UserRole.TRAINER },
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should throw when user is not owner', async () => {
      templatesRepository.findTemplateById.mockResolvedValue({
        id: 't1',
        createdBy: { id: 'owner-id' },
        isDeleted: false,
      });

      await expect(
        service.createItem(
          't1',
          { exerciseId: 'e1', order: 1 },
          { id: 'trainer-id', role: UserRole.TRAINER },
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('updateItem', () => {
    it('should update item when owner', async () => {
      templatesRepository.findTemplateItemById.mockResolvedValue({
        id: 'i1',
        template: { id: 't1' },
      });
      templatesRepository.findTemplateById.mockResolvedValue({
        id: 't1',
        createdBy: { id: 'trainer-id' },
        isDeleted: false,
      });
      templatesRepository.findTemplateItemById.mockResolvedValueOnce({
        id: 'i1',
        template: { id: 't1' },
      });
      templatesRepository.findTemplateItemById.mockResolvedValueOnce({
        id: 'i1',
        template: { id: 't1' },
        exercise: { id: 'e2' },
        order: 2,
        sets: null,
        reps: null,
        restSeconds: null,
        notes: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const actual = await service.updateItem(
        't1',
        'i1',
        { exerciseId: 'e2', order: 2 },
        { id: 'trainer-id', role: UserRole.TRAINER },
      );

      expect(templatesRepository.updateTemplateItem).toHaveBeenCalled();
      expect(actual.exerciseId).toBe('e2');
    });

    it('should throw when item not in template', async () => {
      templatesRepository.findTemplateItemById.mockResolvedValue({
        id: 'i1',
        template: { id: 'other-template' },
      });

      await expect(
        service.updateItem(
          't1',
          'i1',
          { exerciseId: 'e2', order: 2 },
          { id: 'trainer-id', role: UserRole.TRAINER },
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should throw when updated item cannot be reloaded', async () => {
      templatesRepository.findTemplateItemById.mockResolvedValue({
        id: 'i1',
        template: { id: 't1' },
      });
      templatesRepository.findTemplateById.mockResolvedValue({
        id: 't1',
        createdBy: { id: 'trainer-id' },
        isDeleted: false,
      });
      templatesRepository.findTemplateItemById.mockResolvedValueOnce({
        id: 'i1',
        template: { id: 't1' },
      });
      templatesRepository.findTemplateItemById.mockResolvedValueOnce(null);

      await expect(
        service.updateItem(
          't1',
          'i1',
          { exerciseId: 'e2', order: 2 },
          { id: 'trainer-id', role: UserRole.TRAINER },
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('deleteItem', () => {
    it('should delete item when owner', async () => {
      templatesRepository.findTemplateItemById.mockResolvedValue({
        id: 'i1',
        template: { id: 't1' },
      });
      templatesRepository.findTemplateById.mockResolvedValue({
        id: 't1',
        createdBy: { id: 'trainer-id' },
        isDeleted: false,
      });
      templatesRepository.deleteTemplateItem.mockResolvedValue(true);

      await service.deleteItem('t1', 'i1', {
        id: 'trainer-id',
        role: UserRole.TRAINER,
      });

      expect(templatesRepository.deleteTemplateItem).toHaveBeenCalledWith('i1');
    });

    it('should throw when delete returns false', async () => {
      templatesRepository.findTemplateItemById.mockResolvedValue({
        id: 'i1',
        template: { id: 't1' },
      });
      templatesRepository.findTemplateById.mockResolvedValue({
        id: 't1',
        createdBy: { id: 'trainer-id' },
        isDeleted: false,
      });
      templatesRepository.deleteTemplateItem.mockResolvedValue(false);

      await expect(
        service.deleteItem('t1', 'i1', {
          id: 'trainer-id',
          role: UserRole.TRAINER,
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('importFromCsv', () => {
    it('should throw when role is forbidden', async () => {
      await expect(
        service.importFromCsv('name,templateType\nLeg,TRAINER\n', {
          id: 'trainee-id',
          role: UserRole.TRAINEE,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should throw when CSV is empty', async () => {
      await expect(
        service.importFromCsv('   ', {
          id: 'trainer-id',
          role: UserRole.TRAINER,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

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

    it('should skip item creation when exerciseId is empty', async () => {
      templatesRepository.createTemplate.mockResolvedValue({ id: 't1' });

      const actual = await service.importFromCsv(
        [
          'name,description,templateType,exerciseId,sets,reps,restSeconds,order,notes',
          'Leg day,,TRAINER,,,,,1,""',
        ].join('\n'),
        { id: 'trainer-id', role: UserRole.TRAINER },
      );

      expect(templatesRepository.createTemplate).toHaveBeenCalledTimes(1);
      expect(templatesRepository.createTemplateItem).toHaveBeenCalledTimes(0);
      expect(actual.createdTemplates).toBe(1);
      expect(actual.createdItems).toBe(0);
    });

    it('should throw when templateType invalid', async () => {
      await expect(
        service.importFromCsv('name,templateType\nLeg,INVALID\n', {
          id: 'trainer-id',
          role: UserRole.TRAINER,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should throw when order is invalid', async () => {
      templatesRepository.createTemplate.mockResolvedValue({ id: 't1' });

      await expect(
        service.importFromCsv(
          [
            'name,description,templateType,exerciseId,sets,reps,restSeconds,order,notes',
            'Leg day,,TRAINER,exercise-uuid,3,10,60,0,""',
          ].join('\n'),
          { id: 'trainer-id', role: UserRole.TRAINER },
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('fork', () => {
    it('should throw when role is forbidden', async () => {
      await expect(
        service.fork('t1', { id: 'u1', role: UserRole.TRAINEE }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should block forking own trainer template', async () => {
      templatesRepository.findTemplateById.mockResolvedValue({
        id: 't1',
        createdBy: { id: 'trainer-id' },
        templateType: TemplateType.TRAINER,
        isDeleted: false,
        items: createItemsCollection([]),
      });

      await expect(
        service.fork('t1', { id: 'trainer-id', role: UserRole.TRAINER }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should throw when template not found', async () => {
      templatesRepository.findTemplateById.mockResolvedValue(null);

      await expect(
        service.fork('t1', { id: 'trainer-id', role: UserRole.TRAINER }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should fork SYSTEM template into TRAINER template', async () => {
      const inputTemplateId = 'system-template-id';
      templatesRepository.findTemplateById.mockResolvedValue({
        id: inputTemplateId,
        name: 'Leg day',
        description: '',
        createdBy: { id: 'admin-id' },
        templateType: TemplateType.SYSTEM,
        parentTemplate: null,
        isDeleted: false,
        deletedAt: null,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
        items: createItemsCollection([]),
      });
      templatesRepository.forkTemplate.mockResolvedValue({
        id: 'forked-id',
        name: 'Leg day (Copy)',
        description: '',
        createdBy: { id: 'trainer-id' },
        templateType: TemplateType.TRAINER,
        parentTemplate: { id: inputTemplateId },
        isDeleted: false,
        deletedAt: null,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
        items: createItemsCollection([]),
      });

      const actual = await service.fork(inputTemplateId, {
        id: 'trainer-id',
        role: UserRole.TRAINER,
      });

      expect(templatesRepository.forkTemplate).toHaveBeenCalledWith({
        sourceTemplateId: inputTemplateId,
        createdById: 'trainer-id',
      });
      expect(actual.id).toBe('forked-id');
      expect(actual.templateType).toBe(TemplateType.TRAINER);
      expect(actual.parentTemplateId).toBe(inputTemplateId);
    });
  });
});
