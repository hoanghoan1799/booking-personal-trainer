import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

// Commons
import {
  SortBy,
  SortOrder,
} from '../../../common/enums/pagination/pagination.enum';
import { BaseResponseDto } from '../../../common/dtos/base-response.dto';
import { SuccessMessageResponse } from '../../../common/interfaces/success-message-response.interface';

// Constants
import {
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
} from '../../../common/constants/message.constant';

// Entities
import { Exercise } from '../entities/exercise.entity';

// DTOs
import { ExercisesQueryDto } from '../dto/query-exercise.dto';
import { CreateExerciseDto } from '../dto/create-exercise.dto';
import { ResponseExerciseDto } from '../dto/response-exercise.dto';
import { UpdateExerciseDto } from '../dto/update-exercise.dto';
import { ExerciseResponseDto } from '../dto/exercise-response.dto';

// Repositories
import {
  ExerciseRepositoryToken,
  type ExerciseRepository,
  type ExerciseFindManyFilter,
} from '../repositories/exercise.repository.interface';

@Injectable()
export class ExerciseService {
  constructor(
    @Inject(ExerciseRepositoryToken)
    private readonly exerciseRepo: ExerciseRepository,
  ) {}

  /**
   * Creates a new exercise in the database.
   * @param data The exercise data to be created.
   * @returns A promise of a BaseResponseDto containing the newly created exercise.
   */
  async create(
    data: CreateExerciseDto,
  ): Promise<BaseResponseDto<ExerciseResponseDto>> {
    const exercise = await this.exerciseRepo.create({
      name: data.name,
      description: data.description ?? '',
      muscleGroup: data.muscleGroup,
      equipment: data.equipment,
      videoUrl: data.videoUrl,
      thumbnailUrl: data.thumbnailUrl,
    });
    return BaseResponseDto.ok(exercise);
  }

  /**
   * Gets all exercises filtered by muscle group and equipment.
   * @param query The query object to filter, sort and paginate the exercises.
   * @returns The exercises filtered, sorted and paginated according to the query.
   */
  async getAll(
    query: ExercisesQueryDto,
  ): Promise<BaseResponseDto<ResponseExerciseDto[]>> {
    const {
      page = 1,
      limit = 20,
      muscleGroup,
      equipment,
      search,
      order,
    } = query;
    const offset = (page - 1) * limit;

    const filter: ExerciseFindManyFilter = {
      isDeleted: false,
      muscleGroup,
      equipment,
      search,
    };

    const orderBy = {
      [SortBy.CREATED_AT]: order ?? SortOrder.DESC,
    };

    const [data, totalItems] = await this.exerciseRepo.findAndCount(filter, {
      limit,
      offset,
      orderBy,
    });

    return BaseResponseDto.okWithPagination(data, {
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
  async getOne(id: string): Promise<BaseResponseDto<ExerciseResponseDto>> {
    const exercise = await this.exerciseRepo.findById(id);

    if (!exercise) {
      throw new NotFoundException(ERROR_MESSAGES.EXERCISE.NOT_FOUND);
    }

    return BaseResponseDto.ok(exercise);
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
  ): Promise<BaseResponseDto<ExerciseResponseDto>> {
    const exercise = await this.exerciseRepo.update(id, {
      name: body.name,
      description: body.description,
      muscleGroup: body.muscleGroup,
      equipment: body.equipment,
      videoUrl: body.videoUrl,
      thumbnailUrl: body.thumbnailUrl,
    });
    return BaseResponseDto.ok(exercise);
  }

  /**
   * Soft deletes an exercise with the given id.
   * @param id The id of the exercise to be soft deleted.
   * @returns A success message response.
   * @throws NotFoundException If the exercise is not found.
   */
  async remove(id: string): Promise<void> {
    const exercise = await this.exerciseRepo.findById(id);

    if (!exercise) {
      throw new NotFoundException(ERROR_MESSAGES.EXERCISE.NOT_FOUND);
    }

    await this.exerciseRepo.remove(id);
  }

  /**
   * Soft deletes an exercise with the given id.
   * @param id The id of the exercise to be soft deleted.
   * @returns A success message response.
   * @throws NotFoundException If the exercise is not found.
   */
  async softDelete(id: string): Promise<SuccessMessageResponse> {
    const deleted = await this.exerciseRepo.softDelete(id);

    if (!deleted) {
      throw new NotFoundException(ERROR_MESSAGES.EXERCISE.NOT_FOUND);
    }

    return { message: SUCCESS_MESSAGES.EXERCISE.DELETED };
  }

  /**
   * Restore a deleted exercise
   * @param id The id of the exercise to be restored
   * @returns A success message response
   * @throws NotFoundException If the exercise is not found
   */
  async restore(id: string): Promise<SuccessMessageResponse> {
    const restored = await this.exerciseRepo.restore(id);

    if (!restored) {
      throw new NotFoundException(ERROR_MESSAGES.EXERCISE.NOT_FOUND);
    }

    return { message: SUCCESS_MESSAGES.EXERCISE.RESTORED };
  }

  /**
   * Finds exercises by their ids.
   * @param ids The ids of the exercises to find.
   * @returns The exercises if found.
   * @throws {BadRequestException} If the exercises are not found or if the ids contain invalid exercise ids.
   */
  async findByIds(ids: string[]): Promise<Exercise[]> {
    const exercises = await this.exerciseRepo.findByIds(ids);

    if (exercises.length !== ids.length) {
      throw new BadRequestException(ERROR_MESSAGES.WORKOUT.INVALID_EXERCISES);
    }

    return exercises;
  }
}
