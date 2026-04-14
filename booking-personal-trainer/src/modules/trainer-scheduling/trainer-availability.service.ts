import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { NotFoundException } from '@nestjs/common';

// Commons
import { BaseResponseDto } from '../../common/dtos/base-response.dto';
import {
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
} from '../../common/constants/pagination.constant';
import { SortOrder } from '../../common/enums/pagination/pagination.enum';
import { ERROR_MESSAGES } from '../../common/constants/message.constant';

// Entities
import { User } from '../user/entities/user.entity';
import { TrainerAvailability } from './entities/trainer-availability.entity';

// DTOs
import { CreateTrainerAvailabilityDto } from './dtos/create-trainer-availability.dto';
import { UpdateTrainerAvailabilityDto } from './dtos/update-trainer-availability.dto';

// Repositories
import {
  TrainerAvailabilityRepositoryToken,
  type TrainerAvailabilityRepository,
} from './repositories/trainer-availability.repository.interface';

import { TrainerScheduleConflictService } from './trainer-schedule-conflict.service';

type GetMyAvailabilitiesResult = BaseResponseDto<TrainerAvailability[]>;

@Injectable()
export class TrainerAvailabilityService {
  private static readonly AVAILABILITY_MIN_DURATION_MS = 60 * 60 * 1000;

  constructor(
    @Inject(TrainerAvailabilityRepositoryToken)
    private readonly availabilityRepo: TrainerAvailabilityRepository,
    private readonly scheduleConflictService: TrainerScheduleConflictService,
  ) {}

  private assertValidAvailabilityWindow(start: Date, end: Date): void {
    if (start >= end) {
      throw new BadRequestException(ERROR_MESSAGES.BOOKING.INVALID_TIME_RANGE);
    }
    const durationMs = end.getTime() - start.getTime();
    if (durationMs < TrainerAvailabilityService.AVAILABILITY_MIN_DURATION_MS) {
      throw new BadRequestException(
        ERROR_MESSAGES.TRAINER.AVAILABILITY_MIN_ONE_HOUR,
      );
    }
  }

  async getMyAvailabilities(
    currentUser: User,
  ): Promise<GetMyAvailabilitiesResult> {
    const page: number = DEFAULT_PAGE;
    const limit: number = DEFAULT_LIMIT;
    const [items, totalItems] = await this.availabilityRepo.findAndCount(
      { trainerId: currentUser.id },
      {
        limit,
        offset: (page - 1) * limit,
        orderBy: { createdAt: SortOrder.DESC },
      },
    );
    return BaseResponseDto.okWithPagination(items, { totalItems, page, limit });
  }

  async createMyAvailability(
    data: CreateTrainerAvailabilityDto,
    currentUser: User,
  ): Promise<TrainerAvailability> {
    const start: Date = new Date(data.startTime);
    const end: Date = new Date(data.endTime);
    this.assertValidAvailabilityWindow(start, end);
    await this.scheduleConflictService.assertNoOverlap({
      trainerId: currentUser.id,
      start,
      end,
    });
    return this.availabilityRepo.create({
      trainer: currentUser,
      dayOfWeek: data.dayOfWeek,
      startTime: start,
      endTime: end,
    });
  }

  async updateMyAvailability(
    availabilityId: string,
    data: UpdateTrainerAvailabilityDto,
    currentUser: User,
  ): Promise<TrainerAvailability> {
    const availability = await this.availabilityRepo.findById(availabilityId);
    if (!availability) {
      throw new NotFoundException(
        ERROR_MESSAGES.TRAINER.AVAILABILITY_NOT_FOUND,
      );
    }
    if (availability.trainer.id !== currentUser.id) {
      throw new NotFoundException(
        ERROR_MESSAGES.TRAINER.AVAILABILITY_NOT_FOUND,
      );
    }
    const start: Date = data.startTime
      ? new Date(data.startTime)
      : availability.startTime;
    const end: Date = data.endTime
      ? new Date(data.endTime)
      : availability.endTime;
    this.assertValidAvailabilityWindow(start, end);
    await this.scheduleConflictService.assertNoOverlap({
      trainerId: currentUser.id,
      start,
      end,
      excludeAvailabilityId: availabilityId,
    });
    availability.startTime = start;
    availability.endTime = end;
    await this.availabilityRepo.save(availability);
    return availability;
  }

  async deleteMyAvailability(
    availabilityId: string,
    currentUser: User,
  ): Promise<void> {
    const availability = await this.availabilityRepo.findById(availabilityId);
    if (!availability) {
      throw new NotFoundException(
        ERROR_MESSAGES.TRAINER.AVAILABILITY_NOT_FOUND,
      );
    }
    if (availability.trainer.id !== currentUser.id) {
      throw new NotFoundException(
        ERROR_MESSAGES.TRAINER.AVAILABILITY_NOT_FOUND,
      );
    }
    await this.availabilityRepo.remove(availability);
  }
}
