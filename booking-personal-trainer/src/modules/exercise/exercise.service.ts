import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import {
  EntityManager,
  EntityRepository,
  FilterQuery,
  wrap,
} from '@mikro-orm/core';

// Commons
import {
  SortBy,
  SortOrder,
} from '../../common/enums/pagination/pagination.enum';
import { BaseResponse } from '../../common/dtos/base-response.dto';

// Constants
import {
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
} from '../../common/constants/message.constant';

// Entities
import { Exercise } from './entities/exercise.entity';

// DTOs
import { ExercisesQueryDto } from './dto/query-exercise.dto';
import { CreateExerciseDto } from './dto/create-exercise.dto';
import { ResponseExerciseDto } from './dto/response-exercise.dto';
import { UpdateExerciseDto } from './dto/update-exercise.dto';
import { SuccessMessageResponse } from 'src/common/interfaces/success-message-response.interface';
import { ExerciseResponseDto } from './dto/exercise-response.dto';

@Injectable()
export class ExerciseService {
  constructor(
    @InjectRepository(Exercise)
    private readonly exerciseRepo: EntityRepository<Exercise>,
    private readonly em: EntityManager,
  ) {}

  /**
   * Creates a new exercise in the database.
   * @param data The exercise data to be created.
   * @returns A promise of a BaseResponse containing the newly created exercise.
   */
  async create(
    data: CreateExerciseDto,
  ): Promise<BaseResponse<ExerciseResponseDto>> {
    const exercise = this.exerciseRepo.create(data);

    await this.em.persist(exercise).flush();

    return BaseResponse.ok(exercise);
  }

  /**
   * Gets all exercises filtered by muscle group and equipment.
   * @param query The query object to filter, sort and paginate the exercises.
   * @returns The exercises filtered, sorted and paginated according to the query.
   */
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

    return BaseResponse.okWithPagination(data, {
      page,
      limit,
      totalItems,
    });
  }

  /**
   * Retrieves an exercise by its id.
   * @throws NotFoundException If the exercise with the given id is not found.
   * @returns The exercise with the given id if found.
   */
  async getOne(id: string): Promise<BaseResponse<ExerciseResponseDto>> {
    const exercise = await this.exerciseRepo.findOne({ id });

    if (!exercise) {
      throw new NotFoundException(ERROR_MESSAGES.EXERCISE.NOT_FOUND);
    }

    return BaseResponse.ok(exercise);
  }

  /**
   * Updates an exercise with the given id.
   * @param id The id of the exercise to be updated.
   * @param body The updated exercise data.
   * @returns The updated exercise.
   * @throws NotFoundException If the exercise is not found.
   */
  async update(
    id: string,
    body: UpdateExerciseDto,
  ): Promise<BaseResponse<ExerciseResponseDto>> {
    const exercise = await this.exerciseRepo.findOne({ id });

    if (!exercise) {
      throw new NotFoundException(ERROR_MESSAGES.EXERCISE.NOT_FOUND);
    }

    wrap(exercise).assign(body, {
      onlyProperties: true,
    });

    await this.em.flush();

    return BaseResponse.ok(exercise);
  }

  /**
   * Soft deletes an exercise with the given id.
   * Sets the isDeleted flag to true and the deletedAt timestamp to the current date and time.
   * @param id The id of the exercise to be soft deleted.
   * @returns A success message response.
   * @throws NotFoundException If the exercise is not found.
   */
  async remove(id: string): Promise<void> {
    const exercise = await this.exerciseRepo.findOne({ id });

    if (!exercise) {
      throw new NotFoundException(ERROR_MESSAGES.EXERCISE.NOT_FOUND);
    }

    await this.em.remove(exercise).flush();
  }

  /**
   * Soft deletes an exercise with the given id.
   * Sets the isDeleted flag to true and the deletedAt timestamp to the current date and time.
   * @param id The id of the exercise to be soft deleted.
   * @returns A success message response.
   * @throws NotFoundException If the exercise is not found.
   */
  async softDelete(id: string): Promise<SuccessMessageResponse> {
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

    return { message: SUCCESS_MESSAGES.EXERCISE.DELETED };
  }

  /**
   * Restore a deleted exercise
   * @param id The id of the exercise to be restored
   * @returns A success message response
   * @throws NotFoundException If the exercise is not found
   */
  async restore(id: string): Promise<SuccessMessageResponse> {
    const exercise = await this.exerciseRepo.findOne({ id, isDeleted: true });

    if (!exercise) {
      throw new NotFoundException(ERROR_MESSAGES.EXERCISE.NOT_FOUND);
    }

    exercise.isDeleted = false;
    exercise.deletedAt = null;

    await this.em.flush();

    return { message: SUCCESS_MESSAGES.EXERCISE.RESTORED };
  }

  /**
   * Finds exercises by their ids.
   * @param ids The ids of the exercises to find.
   * @returns The exercises if found, or an error if not found.
   * @throws {BadRequestException} If the exercises are not found or if the ids contain invalid exercise ids.
   */
  async findByIds(ids: string[]): Promise<Exercise[]> {
    const exercises = await this.exerciseRepo.find({
      id: { $in: ids },
      isDeleted: false,
    });

    if (exercises.length !== ids.length) {
      throw new BadRequestException(ERROR_MESSAGES.WORKOUT.INVALID_EXERCISES);
    }

    return exercises;
  }
}
