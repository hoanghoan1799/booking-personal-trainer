import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository, FilterQuery } from '@mikro-orm/core';
import { plainToInstance } from 'class-transformer';

// Commons
import {
  SortBy,
  SortOrder,
} from '../../common/enums/pagination/pagination.enum';
import { BaseResponse } from '../../common/dtos/base-response.dto';

// Constants
import { ERROR_MESSAGES } from '../../common/constants/message.constant';

// Entities
import { Exercise } from './entities/exercise.entity';

// DTOs
import { ExercisesQueryDto } from './dto/query-exercise.dto';
import { CreateExerciseDto } from './dto/create-exercise.dto';
import { ResponseExerciseDto } from './dto/response-exercise.dto';
import { UpdateExerciseDto } from './dto/update-exercise.dto';

@Injectable()
export class ExerciseService {
  constructor(
    @InjectRepository(Exercise)
    private readonly exerciseRepo: EntityRepository<Exercise>,
    private readonly em: EntityManager,
  ) {}

  async create(data: CreateExerciseDto): Promise<BaseResponse<Exercise>> {
    const exercise = this.exerciseRepo.create(data);

    await this.em.persist(exercise).flush();

    return { data: exercise };
  }

  async getAll(
    query: ExercisesQueryDto,
  ): Promise<BaseResponse<ResponseExerciseDto[]>> {
    const {
      page = 1,
      limit = 20,
      muscleGroup,
      equipment,
      search,
      order,
    } = query;
    const offset = (page - 1) * limit;

    const where: FilterQuery<Exercise> = {
      isDeleted: false,
    };

    if (muscleGroup) {
      where.muscleGroup = muscleGroup;
    }

    if (equipment) {
      where.equipment = equipment;
    }

    if (search) {
      where.name = { $ilike: `%${search}%` };
    }

    const orderBy = {
      [SortBy.CREATED_AT]: order ?? SortOrder.DESC,
    };

    const [data, totalItems] = await this.exerciseRepo.findAndCount(where, {
      limit,
      offset,
      orderBy,
    });

    return {
      data: plainToInstance(ResponseExerciseDto, data, {
        excludeExtraneousValues: true,
      }),
      meta: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
      },
    };
  }

  getOne(id: string) {
    return `This action returns a #${id} exercise`;
  }

  async update(id: string, body: UpdateExerciseDto) {
    const exercise = await this.exerciseRepo.findOne({ id });

    if (!exercise) {
      throw new NotFoundException(ERROR_MESSAGES.EXERCISE.NOT_FOUND);
    }

    await this.em.persist(body).flush();

    return exercise;
  }

  async remove(id: string): Promise<void> {
    const exercise = await this.exerciseRepo.findOne({ id });

    if (!exercise) {
      throw new NotFoundException(ERROR_MESSAGES.EXERCISE.NOT_FOUND);
    }

    await this.em.remove(exercise).flush();
  }

  async softDelete(id: string) {
    const exercise = await this.exerciseRepo.findOne({
      id,
      isDeleted: false,
    });

    if (!exercise) {
      throw new NotFoundException(ERROR_MESSAGES.EXERCISE.NOT_FOUND);
    }

    exercise.isDeleted = true;
    exercise.deletedAt = new Date();

    await this.em.flush();

    return { message: 'Exercise deleted' };
  }

  async restore(id: string) {
    const exercise = await this.exerciseRepo.findOne({ id, isDeleted: true });

    if (!exercise) {
      throw new NotFoundException(ERROR_MESSAGES.EXERCISE.NOT_FOUND);
    }

    exercise.isDeleted = false;
    exercise.deletedAt = null;

    await this.em.flush();

    return { message: 'Exercise restored' };
  }
}
