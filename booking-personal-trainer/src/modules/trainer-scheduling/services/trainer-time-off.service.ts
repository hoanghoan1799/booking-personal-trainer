import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

// Commons
import dayjs from '../../../common/utils/date-time/utc-dayjs';
import { BaseResponseDto } from '../../../common/dtos/base-response.dto';
import {
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
} from '../../../common/constants/pagination.constant';
import { SortOrder } from '../../../common/enums/pagination/pagination.enum';
import { ERROR_MESSAGES } from '../../../common/constants/message.constant';

// Entities
import { User } from '../../user/entities/user.entity';
import { TrainerTimeOff } from '../entities/trainer-time-off.entity';

// DTOs
import { CreateTrainerTimeOffDto } from '../dtos/create-trainer-time-off.dto';
import { UpdateTrainerTimeOffDto } from '../dtos/update-trainer-time-off.dto';

// Repositories
import {
  TrainerTimeOffRepositoryToken,
  type TrainerTimeOffRepository,
} from '../repositories/trainer-time-off.repository.interface';

import { TrainerScheduleConflictService } from './trainer-schedule-conflict.service';
import { TrainerSchedulingConstants } from '../constants/trainer-scheduling.constants';

type GetMyTimeOffResult = BaseResponseDto<TrainerTimeOff[]>;

@Injectable()
export class TrainerTimeOffService {
  constructor(
    @Inject(TrainerTimeOffRepositoryToken)
    private readonly timeOffRepo: TrainerTimeOffRepository,
    private readonly scheduleConflictService: TrainerScheduleConflictService,
  ) {}

  private assertValidTimeOffWindow(start: Date, end: Date): void {
    if (start >= end) {
      throw new BadRequestException(ERROR_MESSAGES.BOOKING.INVALID_TIME_RANGE);
    }
    const durationMs = end.getTime() - start.getTime();
    if (
      durationMs <
      TrainerSchedulingConstants.TimeOff.MinimumDurationMilliseconds
    ) {
      throw new BadRequestException(
        ERROR_MESSAGES.TRAINER.TIME_OFF_MIN_THIRTY_MINUTES,
      );
    }
  }

  private assertHasTimeOffUpdateFields(data: UpdateTrainerTimeOffDto): void {
    if (
      data.reason === undefined &&
      data.startTime === undefined &&
      data.endTime === undefined
    ) {
      throw new BadRequestException(
        ERROR_MESSAGES.TRAINER.TIME_OFF_NOTHING_TO_UPDATE,
      );
    }
  }

  async getMyTimeOff(currentUser: User): Promise<GetMyTimeOffResult> {
    const page: number = DEFAULT_PAGE;
    const limit: number = DEFAULT_LIMIT;
    const [items, totalItems] = await this.timeOffRepo.findAndCount(
      { trainerId: currentUser.id },
      {
        limit,
        offset: (page - 1) * limit,
        orderBy: { createdAt: SortOrder.DESC },
      },
    );
    return BaseResponseDto.okWithPagination(items, { totalItems, page, limit });
  }

  async createMyTimeOff(
    data: CreateTrainerTimeOffDto,
    currentUser: User,
  ): Promise<TrainerTimeOff> {
    const start: Date = dayjs.utc(data.startTime).toDate();
    const end: Date = dayjs.utc(data.endTime).toDate();
    this.assertValidTimeOffWindow(start, end);
    await this.scheduleConflictService.assertNoOverlap({
      trainerId: currentUser.id,
      start,
      end,
    });
    return this.timeOffRepo.create({
      trainer: currentUser,
      reason: data.reason,
      startTime: start,
      endTime: end,
    });
  }

  async updateMyTimeOff(
    timeOffId: string,
    data: UpdateTrainerTimeOffDto,
    currentUser: User,
  ): Promise<TrainerTimeOff> {
    this.assertHasTimeOffUpdateFields(data);
    const timeOff = await this.timeOffRepo.findById(timeOffId);
    if (!timeOff) {
      throw new NotFoundException(ERROR_MESSAGES.TRAINER.TIME_OFF_NOT_FOUND);
    }
    if (timeOff.trainer.id !== currentUser.id) {
      throw new NotFoundException(ERROR_MESSAGES.TRAINER.TIME_OFF_NOT_FOUND);
    }
    const start: Date = data.startTime
      ? dayjs.utc(data.startTime).toDate()
      : timeOff.startTime;
    const end: Date = data.endTime
      ? dayjs.utc(data.endTime).toDate()
      : timeOff.endTime;
    this.assertValidTimeOffWindow(start, end);
    await this.scheduleConflictService.assertNoOverlap({
      trainerId: currentUser.id,
      start,
      end,
      excludeTimeOffId: timeOffId,
    });
    if (data.reason !== undefined) {
      timeOff.reason = data.reason;
    }
    timeOff.startTime = start;
    timeOff.endTime = end;
    await this.timeOffRepo.save(timeOff);
    return timeOff;
  }

  async deleteMyTimeOff(timeOffId: string, currentUser: User): Promise<void> {
    const timeOff = await this.timeOffRepo.findById(timeOffId);
    if (!timeOff) {
      throw new NotFoundException(ERROR_MESSAGES.TRAINER.TIME_OFF_NOT_FOUND);
    }
    if (timeOff.trainer.id !== currentUser.id) {
      throw new NotFoundException(ERROR_MESSAGES.TRAINER.TIME_OFF_NOT_FOUND);
    }
    await this.timeOffRepo.remove(timeOff);
  }

  /**
   * Any time-off overlapping the range for a trainer (booking conflict check).
   */
  async getOverlappingTimeOffForTrainer(
    trainerId: string,
    rangeStart: Date,
    rangeEnd: Date,
  ): Promise<TrainerTimeOff | null> {
    return this.timeOffRepo.findOverlappingForTrainer(
      trainerId,
      rangeStart,
      rangeEnd,
    );
  }

  /**
   * All time-off segments overlapping the range (slot generation).
   */
  async getOverlappingTimeOffRangesForTrainer(
    trainerId: string,
    rangeStart: Date,
    rangeEnd: Date,
  ): Promise<TrainerTimeOff[]> {
    return this.timeOffRepo.findOverlappingRangesForTrainer(
      trainerId,
      rangeStart,
      rangeEnd,
    );
  }
}
