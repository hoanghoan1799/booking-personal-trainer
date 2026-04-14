import { BadRequestException, Inject, Injectable } from '@nestjs/common';

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
import { TrainerTimeOff } from './entities/trainer-time-off.entity';

// DTOs
import { CreateTrainerTimeOffDto } from './dtos/create-trainer-time-off.dto';

// Repositories
import {
  TrainerTimeOffRepositoryToken,
  type TrainerTimeOffRepository,
} from './repositories/trainer-time-off.repository.interface';

type GetMyTimeOffResult = BaseResponseDto<TrainerTimeOff[]>;

@Injectable()
export class TrainerTimeOffService {
  constructor(
    @Inject(TrainerTimeOffRepositoryToken)
    private readonly timeOffRepo: TrainerTimeOffRepository,
  ) {}

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
    const start: Date = new Date(data.startTime);
    const end: Date = new Date(data.endTime);
    if (start >= end) {
      throw new BadRequestException(ERROR_MESSAGES.BOOKING.INVALID_TIME_RANGE);
    }
    return this.timeOffRepo.create({
      trainer: currentUser,
      reason: data.reason,
      startTime: start,
      endTime: end,
    });
  }
}
