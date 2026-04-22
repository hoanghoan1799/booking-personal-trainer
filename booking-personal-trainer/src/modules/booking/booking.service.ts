import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';

// Commons
import dayjs from '../../common/utils/date-time/utc-dayjs';
import { utcNowAsDate } from '../../common/utils/date-time/utc-date-time.helper';
import { UserRole } from '../../common/enums/user/user.enum';
import { BookingStatus } from '../../common/enums/booking/booking.enum';
import { ERROR_MESSAGES } from '../../common/constants/message.constant';
import { addMinutesToDate } from '../../common/helpers/time.helper';
import { BaseResponseDto } from '../../common/dtos/base-response.dto';
import { SortOrder } from '../../common/enums/pagination/pagination.enum';

// Entities
import { Booking } from './entities/booking.entity';
import { BookingSeries } from './entities/booking-series.entity';
import { User } from '../user/entities/user.entity';
import { EntityManager } from '@mikro-orm/core';

// Services
import { BookingAvailabilityService } from './services/booking-availability.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/enums/notification-type.enum';
import { NotificationTemplates } from '../notifications/constants/notification-template.constant';
import { EmailService } from '../email/email.service';
import { EmailTemplates } from '../email/constants/email-template.constant';
import { collectAdminEmailAddresses } from '../email/helpers/collect-admin-email-addresses.helper';

// DTOs
import { GetBookingsQueryDto } from './dtos/get-booking.dto';
import { CreateBookingDto } from './dtos/create-booking.dto';
import { UpdateBookingStatusDto } from './dtos/update-booking-status.dto';
import {
  CreateBookingsBulkDto,
  type BookingBulkPeriod,
} from './dtos/create-bookings-bulk.dto';

// Repositories
import {
  BookingRepositoryToken,
  type BookingRepository,
  type BookingFindManyFilter,
} from './repositories/booking.repository.interface';
import { UserRepositoryToken } from '../user/repositories/user.repository.interface';
import type { UserRepository } from '../user/repositories/user.repository.interface';

@Injectable()
export class BookingService {
  private readonly logger = new Logger(BookingService.name);

  constructor(
    @Inject(BookingRepositoryToken)
    private readonly bookingRepo: BookingRepository,
    @Inject(UserRepositoryToken)
    private readonly userRepo: UserRepository,
    private readonly em: EntityManager,
    private readonly bookingAvailabilityService: BookingAvailabilityService,
    private readonly notificationsService: NotificationsService,
    private readonly emailService: EmailService,
  ) {}

  private buildBookingTimeRange(input: {
    readonly startTime?: Date | null;
    readonly endTime?: Date | null;
  }): string {
    const startIso: string | null =
      input.startTime instanceof Date ? input.startTime.toISOString() : null;
    const endIso: string | null =
      input.endTime instanceof Date ? input.endTime.toISOString() : null;
    if (!startIso || !endIso) {
      return 'Not provided';
    }
    return `${startIso} - ${endIso}`;
  }

  private buildDateLocalsForPeriod(input: {
    readonly startDateLocal: string;
    readonly period: BookingBulkPeriod;
  }): readonly string[] {
    const start = dayjs
      .utc(input.startDateLocal, 'YYYY-MM-DD', true)
      .startOf('day');
    if (!start.isValid()) return [];
    if (input.period === 'day') {
      return [start.format('YYYY-MM-DD')];
    }
    const endExclusive =
      input.period === 'week'
        ? start.add(7, 'day')
        : input.period === 'month'
          ? start.add(1, 'month')
          : start.add(1, 'year');
    const dayCount = endExclusive.diff(start, 'day');
    if (!Number.isFinite(dayCount) || dayCount <= 0) return [];
    return Array.from({ length: dayCount }).map((_, i) =>
      start.add(i, 'day').format('YYYY-MM-DD'),
    );
  }

  private buildUtcDateTimeForLocalDay(input: {
    readonly dateLocal: string;
    readonly clockTime: string;
  }): dayjs.Dayjs | null {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.dateLocal)) return null;
    if (!/^\d{2}:\d{2}$/.test(input.clockTime)) return null;
    const dt = dayjs.utc(
      `${input.dateLocal} ${input.clockTime}`,
      'YYYY-MM-DD HH:mm',
      true,
    );
    return dt.isValid() ? dt : null;
  }

  async create(data: CreateBookingDto, currentUser: User): Promise<Booking> {
    const { trainerId, startTime, endTime } = data;

    const start = dayjs.utc(startTime);
    const end = dayjs.utc(endTime);
    const now = dayjs.utc();
    if (!start.isValid() || !end.isValid()) {
      throw new BadRequestException(ERROR_MESSAGES.BOOKING.INVALID_TIME_RANGE);
    }
    if (!start.isBefore(end)) {
      throw new BadRequestException(ERROR_MESSAGES.BOOKING.INVALID_TIME_RANGE);
    }
    if (start.valueOf() <= now.valueOf()) {
      throw new BadRequestException(ERROR_MESSAGES.BOOKING.CANNOT_BOOK_IN_PAST);
    }
    const earliestAllowedTime = addMinutesToDate(now.toDate(), 30);
    if (start.valueOf() < earliestAllowedTime.getTime()) {
      throw new BadRequestException(
        ERROR_MESSAGES.BOOKING.MUST_BOOK_BEFORE_30_MINUTES,
      );
    }

    const trainer = await this.userRepo.findById(trainerId);

    if (!trainer) {
      throw new NotFoundException(ERROR_MESSAGES.USER.TRAINER_NOT_AVAILABLE);
    }

    if (trainer.id === currentUser.id) {
      throw new BadRequestException(ERROR_MESSAGES.BOOKING.CANNOT_BOOK_SELF);
    }

    await this.bookingAvailabilityService.assertTrainerCanBeBookedForRange({
      trainerId,
      start: start.toDate(),
      end: end.toDate(),
    });

    const isExclusionViolation = (err: unknown): boolean => {
      const code = (err as { code?: unknown } | null | undefined)?.code;
      return code === '23P01';
    };
    const booking = await this.em
      .transactional(async (em: EntityManager) => {
        const created = em.create(Booking, {
          trainer,
          trainee: currentUser,
          startTime: start.toDate(),
          endTime: end.toDate(),
          status: BookingStatus.PENDING,
        });
        await em.persist(created).flush();
        return created;
      })
      .catch((err: unknown) => {
        if (isExclusionViolation(err)) {
          throw new BadRequestException(
            ERROR_MESSAGES.BOOKING.TIME_SLOT_NOT_AVAILABLE,
          );
        }
        throw err;
      });
    const frontendUrl: string = (process.env.FRONTEND_URL ?? '').replace(
      /\/$/,
      '',
    );
    const bookingTime: string = this.buildBookingTimeRange({
      startTime: booking.startTime,
      endTime: booking.endTime,
    });
    const bookingUrl: string = `${frontendUrl}/bookings/${booking.id}`;

    try {
      await this.notificationsService.notifyAdmins({
        type: NotificationType.AdminTraineeBookedTrainer,
        ...NotificationTemplates.adminTraineeBookedTrainer({
          traineeUserName: currentUser.userName,
          trainerUserName: trainer.userName,
        }),
        data: {
          bookingId: booking.id,
          traineeId: currentUser.id,
          trainerId: trainer.id,
          startTime: booking.startTime,
          endTime: booking.endTime,
        },
      });
      const adminEmails = await collectAdminEmailAddresses(this.userRepo);
      const adminBookingEmail = EmailTemplates.adminTraineeBookedTrainer({
        traineeName: currentUser.userName,
        trainerName: trainer.userName,
        bookingTime,
        bookingUrl,
      });
      await this.emailService.send({
        to: adminEmails,
        subject: adminBookingEmail.subject,
        text: adminBookingEmail.text,
        html: adminBookingEmail.html,
      });
      await this.notificationsService.createAndPublishToUsers({
        notifications: [
          {
            recipientUserId: trainer.id,
            type: NotificationType.TrainerNewBooking,
            ...NotificationTemplates.trainerNewBooking({
              traineeUserName: currentUser.userName,
              trainerUserName: trainer.userName,
            }),
            data: {
              bookingId: booking.id,
              traineeId: currentUser.id,
              trainerId: trainer.id,
              startTime: booking.startTime,
              endTime: booking.endTime,
            },
          },
        ],
      });
      const trainerNewBookingEmail = EmailTemplates.trainerNewBooking({
        traineeName: currentUser.userName,
        trainerName: trainer.userName,
        bookingTime,
        bookingUrl,
      });
      await this.emailService.send({
        to: trainer.email,
        subject: trainerNewBookingEmail.subject,
        text: trainerNewBookingEmail.text,
        html: trainerNewBookingEmail.html,
      });
      const traineeBookingRequestEmail =
        EmailTemplates.traineeNewBookingRequestCreated({
          traineeName: currentUser.userName,
          trainerName: trainer.userName,
          bookingTime,
          bookingUrl,
        });
      await this.emailService.send({
        to: currentUser.email,
        subject: traineeBookingRequestEmail.subject,
        text: traineeBookingRequestEmail.text,
        html: traineeBookingRequestEmail.html,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(
        `Booking ${booking.id} created but side effects failed: ${message}`,
      );
    }

    return booking;
  }

  async createBulk(
    data: CreateBookingsBulkDto,
    currentUser: User,
  ): Promise<Booking[]> {
    const now = dayjs.utc();
    const earliestAllowedTime = addMinutesToDate(now.toDate(), 30);
    const trainer = await this.userRepo.findById(data.trainerId);
    if (!trainer) {
      throw new NotFoundException(ERROR_MESSAGES.USER.TRAINER_NOT_AVAILABLE);
    }
    if (trainer.id === currentUser.id) {
      throw new BadRequestException(ERROR_MESSAGES.BOOKING.CANNOT_BOOK_SELF);
    }
    const dateLocals = this.buildDateLocalsForPeriod({
      startDateLocal: data.startDate,
      period: data.period,
    });
    if (dateLocals.length === 0) {
      throw new BadRequestException('Invalid start date');
    }
    const occurrences = dateLocals.map((dateLocal) => {
      const start = this.buildUtcDateTimeForLocalDay({
        dateLocal,
        clockTime: data.startClockTime,
      });
      const end = this.buildUtcDateTimeForLocalDay({
        dateLocal,
        clockTime: data.endClockTime,
      });
      return { dateLocal, start, end };
    });
    const invalidOccurrence = occurrences.find((o) => !o.start || !o.end);
    if (invalidOccurrence) {
      throw new BadRequestException(ERROR_MESSAGES.BOOKING.INVALID_TIME_RANGE);
    }
    const invalidRange = occurrences.find((o) => !o.start!.isBefore(o.end));
    if (invalidRange) {
      throw new BadRequestException(ERROR_MESSAGES.BOOKING.INVALID_TIME_RANGE);
    }
    const hasPast = occurrences.find(
      (o) => o.start!.valueOf() <= now.valueOf(),
    );
    if (hasPast) {
      throw new BadRequestException(ERROR_MESSAGES.BOOKING.CANNOT_BOOK_IN_PAST);
    }
    const violatesNotice = occurrences.find(
      (o) => o.start!.valueOf() < earliestAllowedTime.getTime(),
    );
    if (violatesNotice) {
      throw new BadRequestException(
        ERROR_MESSAGES.BOOKING.MUST_BOOK_BEFORE_30_MINUTES,
      );
    }
    for (const o of occurrences) {
      await this.bookingAvailabilityService.assertTrainerCanBeBookedForRange({
        trainerId: trainer.id,
        start: o.start!.toDate(),
        end: o.end!.toDate(),
      });
    }
    const isExclusionViolation = (err: unknown): boolean => {
      const code = (err as { code?: unknown } | null | undefined)?.code;
      return code === '23P01';
    };
    const createdBookings = await this.em
      .transactional(async (em: EntityManager) => {
        const startDate = occurrences[0]?.start;
        const endDate = occurrences[occurrences.length - 1]?.start;
        if (!startDate || !endDate) {
          throw new BadRequestException('Invalid occurrences');
        }
        const series = em.create(BookingSeries, {
          trainer,
          trainee: currentUser,
          startDate: startDate.startOf('day').toDate(),
          endDate: endDate.startOf('day').toDate(),
          startClockTime: data.startClockTime,
          endClockTime: data.endClockTime,
          period: data.period,
        });
        em.persist(series);
        const created: Booking[] = [];
        for (const o of occurrences) {
          const booking = em.create(Booking, {
            trainer,
            trainee: currentUser,
            series,
            startTime: o.start!.toDate(),
            endTime: o.end!.toDate(),
            status: BookingStatus.PENDING,
          });
          em.persist(booking);
          created.push(booking);
        }
        await em.flush();
        return created;
      })
      .catch((err: unknown) => {
        if (isExclusionViolation(err)) {
          throw new BadRequestException(
            ERROR_MESSAGES.BOOKING.TIME_SLOT_NOT_AVAILABLE,
          );
        }
        throw err;
      });
    const frontendUrl: string = (process.env.FRONTEND_URL ?? '').replace(
      /\/$/,
      '',
    );
    const bookingSeriesUrl: string = `${frontendUrl}/bookings`;
    const sessionCount: number = createdBookings.length;
    const startDateLocal: string = dayjs
      .utc(createdBookings[0]?.startTime)
      .format('YYYY-MM-DD');
    const endDateLocal: string = dayjs
      .utc(createdBookings[createdBookings.length - 1]?.startTime)
      .format('YYYY-MM-DD');
    const occurrencesPreview: readonly string[] = createdBookings
      .slice(0, 5)
      .map(
        (b) =>
          `${dayjs.utc(b.startTime).format('ddd, MMM D, YYYY')} (${data.startClockTime}–${data.endClockTime})`,
      );
    try {
      await this.notificationsService.notifyAdmins({
        type: NotificationType.AdminTraineeBookedTrainerSeries,
        ...NotificationTemplates.adminTraineeBookedTrainerSeries({
          traineeUserName: currentUser.userName,
          trainerUserName: trainer.userName,
          sessionCount,
          startDate: startDateLocal,
          endDate: endDateLocal,
          startClockTime: data.startClockTime,
          endClockTime: data.endClockTime,
        }),
        data: {
          trainerId: trainer.id,
          traineeId: currentUser.id,
          startDate: startDateLocal,
          endDate: endDateLocal,
          startClockTime: data.startClockTime,
          endClockTime: data.endClockTime,
          sessionCount,
        },
      });
      await this.notificationsService.createAndPublishToUsers({
        notifications: [
          {
            recipientUserId: trainer.id,
            type: NotificationType.TrainerNewBookingSeries,
            ...NotificationTemplates.trainerNewBookingSeries({
              traineeUserName: currentUser.userName,
              trainerUserName: trainer.userName,
              sessionCount,
              startDate: startDateLocal,
              endDate: endDateLocal,
              startClockTime: data.startClockTime,
              endClockTime: data.endClockTime,
            }),
            data: {
              trainerId: trainer.id,
              traineeId: currentUser.id,
              startDate: startDateLocal,
              endDate: endDateLocal,
              startClockTime: data.startClockTime,
              endClockTime: data.endClockTime,
              sessionCount,
            },
          },
        ],
      });
      await this.notificationsService.createAndPublishToUsers({
        notifications: [
          {
            recipientUserId: currentUser.id,
            type: NotificationType.TraineeNewBookingSeries,
            ...NotificationTemplates.traineeNewBookingSeries({
              traineeUserName: currentUser.userName,
              trainerUserName: trainer.userName,
              sessionCount,
              startDate: startDateLocal,
              endDate: endDateLocal,
              startClockTime: data.startClockTime,
              endClockTime: data.endClockTime,
            }),
            data: {
              trainerId: trainer.id,
              traineeId: currentUser.id,
              startDate: startDateLocal,
              endDate: endDateLocal,
              startClockTime: data.startClockTime,
              endClockTime: data.endClockTime,
              sessionCount,
            },
          },
        ],
      });
      const adminEmails = await collectAdminEmailAddresses(this.userRepo);
      const adminEmail = EmailTemplates.adminTraineeBookedTrainerSeries({
        traineeName: currentUser.userName,
        trainerName: trainer.userName,
        sessionCount,
        startDate: startDateLocal,
        endDate: endDateLocal,
        startClockTime: data.startClockTime,
        endClockTime: data.endClockTime,
        bookingSeriesUrl,
        occurrencesPreview,
      });
      await this.emailService.send({
        to: adminEmails,
        subject: adminEmail.subject,
        text: adminEmail.text,
        html: adminEmail.html,
      });
      const trainerEmail = EmailTemplates.trainerNewBookingSeries({
        traineeName: currentUser.userName,
        trainerName: trainer.userName,
        sessionCount,
        startDate: startDateLocal,
        endDate: endDateLocal,
        startClockTime: data.startClockTime,
        endClockTime: data.endClockTime,
        bookingSeriesUrl,
        occurrencesPreview,
      });
      await this.emailService.send({
        to: trainer.email,
        subject: trainerEmail.subject,
        text: trainerEmail.text,
        html: trainerEmail.html,
      });
      const traineeEmail = EmailTemplates.traineeNewBookingRequestSeriesCreated(
        {
          traineeName: currentUser.userName,
          trainerName: trainer.userName,
          sessionCount,
          startDate: startDateLocal,
          endDate: endDateLocal,
          startClockTime: data.startClockTime,
          endClockTime: data.endClockTime,
          bookingSeriesUrl,
          occurrencesPreview,
        },
      );
      await this.emailService.send({
        to: currentUser.email,
        subject: traineeEmail.subject,
        text: traineeEmail.text,
        html: traineeEmail.html,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(
        `Bulk bookings created but aggregated side effects failed: ${message}`,
      );
    }
    return createdBookings;
  }

  async getAll(
    query: GetBookingsQueryDto,
    currentUser: User,
  ): Promise<BaseResponseDto<Booking[]>> {
    const { page, limit, status, traineeId, trainerId, order } = query;

    const filter: BookingFindManyFilter = {};

    switch (currentUser.role) {
      case UserRole.ADMIN:
        break;
      case UserRole.TRAINER:
        filter.trainer = currentUser.id;
        break;
      case UserRole.TRAINEE:
        filter.trainee = currentUser.id;
        break;
      default:
        filter.trainee = currentUser.id;
    }

    if (currentUser.role === UserRole.ADMIN) {
      if (traineeId) {
        filter.trainee = traineeId;
      }
      if (trainerId) {
        filter.trainer = trainerId;
      }
    }

    if (status) {
      filter.status = status;
    }

    const [bookings, totalItems] = await this.bookingRepo.findAndCount(filter, {
      limit,
      offset: (page - 1) * limit,
      orderBy: { createdAt: order ?? SortOrder.DESC },
    });

    return BaseResponseDto.okWithPagination(bookings, {
      totalItems,
      page,
      limit,
    });
  }

  getOne(id: string) {
    return `This action returns a #${id} booking`;
  }

  async updateStatus(
    id: string,
    dto: UpdateBookingStatusDto,
    currentUser: User,
  ): Promise<Booking> {
    const booking = await this.bookingRepo.findById(id);

    if (!booking) {
      throw new NotFoundException(ERROR_MESSAGES.BOOKING.NOT_FOUND);
    }

    const isAdmin = currentUser.role === UserRole.ADMIN;
    const isTrainerOfBooking = booking.trainer.id === currentUser.id;
    const isTraineeOfBooking = booking.trainee.id === currentUser.id;

    const nextStatus = dto.status;
    const isCancelling = nextStatus === BookingStatus.CANCELLED;
    const isRejecting = nextStatus === BookingStatus.REJECTED;

    if (isRejecting) {
      if (!isAdmin && !isTrainerOfBooking) {
        throw new BadRequestException(
          ERROR_MESSAGES.BOOKING.CANNOT_UPDATE_STATUS,
        );
      }
      if (!dto.rejectionReason || dto.rejectionReason.trim().length < 3) {
        throw new BadRequestException('Rejection reason is required');
      }
    }

    if (isCancelling) {
      if (!isAdmin && !isTrainerOfBooking && !isTraineeOfBooking) {
        throw new BadRequestException(
          ERROR_MESSAGES.BOOKING.CANNOT_UPDATE_STATUS,
        );
      }
      if (!dto.cancellationReason || dto.cancellationReason.trim().length < 3) {
        throw new BadRequestException('Cancellation reason is required');
      }
    }

    if (!isRejecting && !isCancelling) {
      if (!isAdmin && !isTrainerOfBooking) {
        throw new BadRequestException(
          ERROR_MESSAGES.BOOKING.CANNOT_UPDATE_STATUS,
        );
      }
    }

    booking.status = nextStatus;
    booking.statusChangedAt = utcNowAsDate();
    if (isCancelling) {
      booking.cancelledBy = currentUser;
      booking.cancellationReason = (dto.cancellationReason ?? '').trim();
    }
    if (isRejecting) {
      booking.rejectionReason = (dto.rejectionReason ?? '').trim();
    }
    await this.bookingRepo.save(booking);

    if (
      nextStatus === BookingStatus.CONFIRMED &&
      (isAdmin || isTrainerOfBooking)
    ) {
      await this.notificationsService.createAndPublishToUsers({
        notifications: [
          {
            recipientUserId: booking.trainee.id,
            type: NotificationType.TraineeBookingApproved,
            ...NotificationTemplates.traineeBookingApproved({
              traineeUserName: booking.trainee.userName,
              trainerUserName: booking.trainer.userName,
            }),
            data: { bookingId: booking.id, status: nextStatus },
          },
        ],
      });
      const approvedEmail = EmailTemplates.traineeBookingApproved({
        traineeName: booking.trainee.userName,
        trainerName: booking.trainer.userName,
        bookingTime: this.buildBookingTimeRange({
          startTime: booking.startTime,
          endTime: booking.endTime,
        }),
        bookingUrl: `${(process.env.FRONTEND_URL ?? '').replace(/\/$/, '')}/bookings/${booking.id}`,
      });
      await this.emailService.send({
        to: booking.trainee.email,
        subject: approvedEmail.subject,
        text: approvedEmail.text,
        html: approvedEmail.html,
      });
    }

    if (
      nextStatus === BookingStatus.REJECTED &&
      (isAdmin || isTrainerOfBooking)
    ) {
      await this.notificationsService.createAndPublishToUsers({
        notifications: [
          {
            recipientUserId: booking.trainee.id,
            type: NotificationType.TraineeBookingRejected,
            ...NotificationTemplates.traineeBookingRejected({
              traineeUserName: booking.trainee.userName,
              trainerUserName: booking.trainer.userName,
              rejectionReason: booking.rejectionReason ?? null,
            }),
            data: {
              bookingId: booking.id,
              status: nextStatus,
              rejectionReason: booking.rejectionReason ?? null,
            },
          },
        ],
      });
      const rejectedEmail = EmailTemplates.traineeBookingRejected({
        traineeName: booking.trainee.userName,
        trainerName: booking.trainer.userName,
        bookingTime: this.buildBookingTimeRange({
          startTime: booking.startTime,
          endTime: booking.endTime,
        }),
        bookingUrl: `${(process.env.FRONTEND_URL ?? '').replace(/\/$/, '')}/bookings/${booking.id}`,
        rejectionReason: booking.rejectionReason ?? null,
      });
      await this.emailService.send({
        to: booking.trainee.email,
        subject: rejectedEmail.subject,
        text: rejectedEmail.text,
        html: rejectedEmail.html,
      });
    }

    if (nextStatus === BookingStatus.CANCELLED) {
      if (isTrainerOfBooking) {
        await this.notificationsService.createAndPublishToUsers({
          notifications: [
            {
              recipientUserId: booking.trainee.id,
              type: NotificationType.TraineeBookingCancelledByTrainer,
              ...NotificationTemplates.traineeBookingCancelledByTrainer({
                traineeUserName: booking.trainee.userName,
                trainerUserName: booking.trainer.userName,
                cancellationReason: booking.cancellationReason ?? null,
              }),
              data: {
                bookingId: booking.id,
                status: nextStatus,
                cancellationReason: booking.cancellationReason ?? null,
              },
            },
          ],
        });
        const cancelledByTrainerEmail =
          EmailTemplates.traineeBookingCancelledByTrainer({
            traineeName: booking.trainee.userName,
            trainerName: booking.trainer.userName,
            bookingTime: this.buildBookingTimeRange({
              startTime: booking.startTime,
              endTime: booking.endTime,
            }),
            bookingUrl: `${(process.env.FRONTEND_URL ?? '').replace(/\/$/, '')}/bookings/${booking.id}`,
            cancellationReason: booking.cancellationReason ?? null,
          });
        await this.emailService.send({
          to: booking.trainee.email,
          subject: cancelledByTrainerEmail.subject,
          text: cancelledByTrainerEmail.text,
          html: cancelledByTrainerEmail.html,
        });
      }
      if (isTraineeOfBooking) {
        await this.notificationsService.createAndPublishToUsers({
          notifications: [
            {
              recipientUserId: booking.trainer.id,
              type: NotificationType.TrainerBookingCancelledByTrainee,
              ...NotificationTemplates.trainerBookingCancelledByTrainee({
                traineeUserName: booking.trainee.userName,
                trainerUserName: booking.trainer.userName,
                cancellationReason: booking.cancellationReason ?? null,
              }),
              data: {
                bookingId: booking.id,
                status: nextStatus,
                cancellationReason: booking.cancellationReason ?? null,
              },
            },
          ],
        });
        const cancelledByTraineeEmail =
          EmailTemplates.trainerBookingCancelledByTrainee({
            traineeName: booking.trainee.userName,
            trainerName: booking.trainer.userName,
            bookingTime: this.buildBookingTimeRange({
              startTime: booking.startTime,
              endTime: booking.endTime,
            }),
            bookingUrl: `${(process.env.FRONTEND_URL ?? '').replace(/\/$/, '')}/bookings/${booking.id}`,
            cancellationReason: booking.cancellationReason ?? null,
          });
        await this.emailService.send({
          to: booking.trainer.email,
          subject: cancelledByTraineeEmail.subject,
          text: cancelledByTraineeEmail.text,
          html: cancelledByTraineeEmail.html,
        });
      }
    }

    return booking;
  }
}
