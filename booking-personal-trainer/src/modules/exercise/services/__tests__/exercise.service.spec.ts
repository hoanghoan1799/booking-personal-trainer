import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';

// Commons
import {
  SortBy,
  SortOrder,
} from '../../../../common/enums/pagination/pagination.enum';
import {
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
} from '../../../../common/constants/message.constant';
import {
  Equipment,
  MuscleGroup,
} from '../../../../common/enums/exercise/exercise.enum';

// Entities
import { Exercise } from '../../entities/exercise.entity';

// Services
import { ExerciseService } from '../exercise.service';

// Repositories
import { ExerciseRepositoryToken } from '../../repositories/exercise.repository.interface';

describe('ExerciseService', () => {
  let service: ExerciseService;
  let exerciseRepo: {
    create: jest.Mock;
    findAndCount: jest.Mock;
    findById: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
    softDelete: jest.Mock;
    restore: jest.Mock;
    findByIds: jest.Mock;
  };

  beforeEach(async () => {
    exerciseRepo = {
      create: jest.fn(),
      findAndCount: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      remove: jest.fn().mockResolvedValue(undefined),
      softDelete: jest.fn(),
      restore: jest.fn(),
      findByIds: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExerciseService,
        {
          provide: ExerciseRepositoryToken,
          useValue: exerciseRepo,
        },
      ],
    }).compile();

    service = module.get<ExerciseService>(ExerciseService);
  });

  describe('create', () => {
    it('should create exercise and default description to empty string', async () => {
      const created = { id: 'exercise-id', name: 'Pushup' } as Exercise;
      exerciseRepo.create.mockResolvedValue(created);

      const actual = await service.create({
        name: 'Pushup',
        description: undefined as unknown as string,
        muscleGroup: MuscleGroup.CHEST,
        equipment: Equipment.BODYWEIGHT,
      });

      expect(actual.data).toBe(created);
      expect(exerciseRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Pushup',
          description: '',
          muscleGroup: MuscleGroup.CHEST,
          equipment: Equipment.BODYWEIGHT,
        }),
      );
    });
  });

  describe('getAll', () => {
    it('should apply defaults and call repository with filter and paging', async () => {
      const items = [{ id: '1' } as Exercise];
      exerciseRepo.findAndCount.mockResolvedValue([items, 1]);

      const actual = await service.getAll({ page: 1, limit: 20 });

      expect(actual.data).toEqual(items);
      expect(exerciseRepo.findAndCount).toHaveBeenCalledWith(
        {
          isDeleted: false,
          muscleGroup: undefined,
          equipment: undefined,
          search: undefined,
        },
        {
          limit: 20,
          offset: 0,
          orderBy: { [SortBy.CREATED_AT]: SortOrder.DESC },
        },
      );
    });

    it('should pass through query filters and pagination', async () => {
      exerciseRepo.findAndCount.mockResolvedValue([[], 0]);

      await service.getAll({
        page: 2,
        limit: 5,
        muscleGroup: MuscleGroup.BACK,
        equipment: Equipment.BARBELL,
        search: 'row',
        order: SortOrder.ASC,
      });

      expect(exerciseRepo.findAndCount).toHaveBeenCalledWith(
        {
          isDeleted: false,
          muscleGroup: MuscleGroup.BACK,
          equipment: Equipment.BARBELL,
          search: 'row',
        },
        {
          limit: 5,
          offset: 5,
          orderBy: { [SortBy.CREATED_AT]: SortOrder.ASC },
        },
      );
    });
  });

  describe('getOne', () => {
    it('should throw NotFoundException when exercise not found', async () => {
      exerciseRepo.findById.mockResolvedValue(null);

      await expect(service.getOne('missing-id')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getOne('missing-id')).rejects.toThrow(
        ERROR_MESSAGES.EXERCISE.NOT_FOUND,
      );
    });
  });

  describe('update', () => {
    it('should update exercise and return ok', async () => {
      const updated = { id: 'id' } as Exercise;
      exerciseRepo.update.mockResolvedValue(updated);

      const actual = await service.update('id', { name: 'New name' });

      expect(actual.data).toBe(updated);
      expect(exerciseRepo.update).toHaveBeenCalledWith(
        'id',
        expect.objectContaining({ name: 'New name' }),
      );
    });
  });

  describe('remove', () => {
    it('should throw NotFoundException when exercise does not exist', async () => {
      exerciseRepo.findById.mockResolvedValue(null);

      await expect(service.remove('missing')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should call repository remove when exercise exists', async () => {
      exerciseRepo.findById.mockResolvedValue({ id: 'id' } as Exercise);

      await service.remove('id');

      expect(exerciseRepo.remove).toHaveBeenCalledWith('id');
    });
  });

  describe('softDelete', () => {
    it('should throw NotFoundException when softDelete returns false', async () => {
      exerciseRepo.softDelete.mockResolvedValue(false);

      await expect(service.softDelete('missing')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return success message when deleted', async () => {
      exerciseRepo.softDelete.mockResolvedValue(true);

      const actual = await service.softDelete('id');

      expect(actual).toEqual({ message: SUCCESS_MESSAGES.EXERCISE.DELETED });
    });
  });

  describe('restore', () => {
    it('should throw NotFoundException when restore returns false', async () => {
      exerciseRepo.restore.mockResolvedValue(false);

      await expect(service.restore('missing')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return success message when restored', async () => {
      exerciseRepo.restore.mockResolvedValue(true);

      const actual = await service.restore('id');

      expect(actual).toEqual({ message: SUCCESS_MESSAGES.EXERCISE.RESTORED });
    });
  });

  describe('findByIds', () => {
    it('should throw BadRequestException when repository returns fewer exercises than ids', async () => {
      exerciseRepo.findByIds.mockResolvedValue([{ id: 'a' } as Exercise]);

      await expect(service.findByIds(['a', 'b'])).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.findByIds(['a', 'b'])).rejects.toThrow(
        ERROR_MESSAGES.WORKOUT.INVALID_EXERCISES,
      );
    });

    it('should return exercises when all ids are found', async () => {
      const exercises = [{ id: 'a' } as Exercise, { id: 'b' } as Exercise];
      exerciseRepo.findByIds.mockResolvedValue(exercises);

      const actual = await service.findByIds(['a', 'b']);

      expect(actual).toEqual(exercises);
    });
  });
});
