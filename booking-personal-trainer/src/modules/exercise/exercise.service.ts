import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository, FilterQuery } from '@mikro-orm/core';

// Commons
import {
  SortBy,
  SortOrder,
} from '../../common/enums/pagination/pagination.enum';
import { BaseResponse } from '../../common/dtos/base-response.dto';

// Entities
import { Exercise } from './entities/exercise.entity';

// DTOs
import { ExercisesQueryDto } from './dto/query-exercise.dto';
import { CreateExerciseDto } from './dto/create-exercise.dto';
import { ResponseExerciseDto } from './dto/response-exercise.dto';

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

    const where: FilterQuery<Exercise> = {};

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
      data,
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

  update(id: string) {
    return `This action updates a #${id} exercise`;
  }

  remove(id: string) {
    return `This action removes a #${id} exercise`;
  }
}
