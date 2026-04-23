import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';

import { UserRole } from '../../../../common/enums/user/user.enum';
import { BookingStatus } from '../../../../common/enums/booking/booking.enum';
import { TemplateType } from '../../../templates/enums/template-type.enum';

import { WorkoutService } from '../workout.service';
import { WorkoutRepositoryToken } from '../../repositories/workout.repository.interface';
import { UserService } from '../../../user/services/user.service';
import { BookingService } from '../../../booking/services/booking.service';
import { WorkoutPaymentPolicyService } from '../../../payments/services/workout-payment-policy.service';
import { BillingService } from '../../../billing/services/billing.service';
import { NotificationsService } from '../../../notifications/services/notifications.service';
import { EmailService } from '../../../email/services/email.service';
import { EntityManager } from '@mikro-orm/core';
import { Booking } from '../../../booking/entities/booking.entity';
import { ExerciseTemplate } from '../../../templates/entities/exercise-template.entity';
import { Workout } from '../../entities/workout.entity';

const createItemsCollection = <T>(items: T[]): { getItems: () => T[] } => ({
  getItems: () => items,
});

type TransactionalEntityManagerMock = {
  readonly findOne: jest.Mock;
  readonly create: jest.Mock;
  readonly persist: jest.Mock;
  readonly flush: jest.Mock;
  readonly nativeUpdate?: jest.Mock;
  readonly getReference?: jest.Mock;
};

type TransactionalHandler<T> = (
  em: TransactionalEntityManagerMock,
) => Promise<T>;

type EntityClass = typeof Booking | typeof ExerciseTemplate | typeof Workout;

describe('WorkoutService', () => {
  let service: WorkoutService;
  let workoutRepository: {
    createFromBookingTemplate: jest.Mock;
    create: jest.Mock;
    findAndCount: jest.Mock;
    findByIdWithExercises: jest.Mock;
    updateStatusAndCompletions: jest.Mock;
    removeAll: jest.Mock;
    softDelete: jest.Mock;
  };
  let bookingService: { findBookingById: jest.Mock };
  let userService: { findByIdOrNull: jest.Mock };
  let workoutPaymentPolicyService: { isWorkoutPaid: jest.Mock };
  let billingService: {
    createWorkoutCharge: jest.Mock;
    activateCharge: jest.Mock;
    createAndActivateWorkoutChargeAtomic: jest.Mock;
  };
  let notificationsService: { createAndPublishToUsers: jest.Mock };
  let emailService: { send: jest.Mock };
  let em: { transactional: jest.Mock };

  beforeEach(async () => {
    workoutRepository = {
      createFromBookingTemplate: jest.fn(),
      create: jest.fn(),
      findAndCount: jest.fn(),
      findByIdWithExercises: jest.fn(),
      updateStatusAndCompletions: jest.fn(),
      removeAll: jest.fn(),
      softDelete: jest.fn(),
    };
    bookingService = { findBookingById: jest.fn() };
    userService = { findByIdOrNull: jest.fn() };
    workoutPaymentPolicyService = { isWorkoutPaid: jest.fn() };
    billingService = {
      createWorkoutCharge: jest.fn().mockResolvedValue({ id: 'charge-id' }),
      activateCharge: jest.fn().mockResolvedValue(undefined),
      createAndActivateWorkoutChargeAtomic: jest
        .fn()
        .mockResolvedValue({ id: 'charge-id' }),
    };
    notificationsService = {
      createAndPublishToUsers: jest.fn().mockResolvedValue([]),
    };
    emailService = {
      send: jest.fn().mockResolvedValue({ messageId: 'mock-message-id' }),
    };
    em = {
      transactional: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkoutService,
        { provide: WorkoutRepositoryToken, useValue: workoutRepository },
        { provide: BookingService, useValue: bookingService },
        { provide: UserService, useValue: userService },
        {
          provide: WorkoutPaymentPolicyService,
          useValue: workoutPaymentPolicyService,
        },
        { provide: BillingService, useValue: billingService },
        { provide: NotificationsService, useValue: notificationsService },
        { provide: EmailService, useValue: emailService },
        { provide: EntityManager, useValue: em },
      ],
    }).compile();

    service = module.get<WorkoutService>(WorkoutService);
  });

  describe('createForBookingFromTemplate', () => {
    it('should create workout for confirmed booking from SYSTEM template', async () => {
      const booking = {
        id: 'booking-id',
        status: BookingStatus.CONFIRMED,
        startTime: new Date('2026-01-01T10:00:00.000Z'),
        endTime: new Date('2026-01-01T11:00:00.000Z'),
        trainer: { id: 'trainer-id', userName: 'trainer' },
        trainee: {
          id: 'trainee-id',
          userName: 'trainee',
          email: 'trainee@test.com',
        },
      } as unknown as Booking;
      const template = {
        id: 'template-id',
        templateType: TemplateType.SYSTEM,
        isDeleted: false,
        createdBy: { id: 'admin-id' },
        items: createItemsCollection([]),
      } as unknown as ExerciseTemplate;
      const workout = {
        id: 'workout-id',
        booking: { id: 'booking-id' },
        template: { id: 'template-id', name: 'Template' },
        startTime: new Date('2026-01-01T10:00:00.000Z'),
        endTime: new Date('2026-01-01T11:00:00.000Z'),
        status: 'PENDING',
        trainer: { id: 'trainer-id' },
        trainee: { id: 'trainee-id' },
        exercises: { getItems: () => [], add: jest.fn() },
      } as unknown as Workout;
      em.transactional.mockImplementation(
        async (handler: TransactionalHandler<Workout>) =>
          handler({
            findOne: jest.fn().mockImplementation((entity: EntityClass) => {
              if (entity === Booking) return booking;
              if (entity === ExerciseTemplate) return template;
              return null;
            }),
            create: jest.fn().mockImplementation((entity: EntityClass) => {
              if (entity === Workout) return workout;
              return {};
            }),
            persist: jest.fn().mockReturnValue({ flush: jest.fn() }),
            flush: jest.fn().mockResolvedValue(undefined),
            nativeUpdate: jest.fn().mockResolvedValue(0),
            getReference: jest.fn(),
          }),
      );
      bookingService.findBookingById.mockResolvedValue(booking);

      const actual = await service.createForBookingFromTemplate(
        'booking-id',
        { templateId: 'template-id', amountCents: 2500, currency: 'USD' },
        { id: 'trainer-id', role: UserRole.TRAINER },
      );

      expect(actual.id).toBe('workout-id');
      expect(actual.bookingId).toBe('booking-id');
      expect(actual.templateId).toBe('template-id');
      expect(
        billingService.createAndActivateWorkoutChargeAtomic,
      ).toHaveBeenCalled();
    });

    it('should throw NotFoundException when booking missing', async () => {
      em.transactional.mockImplementation(
        async (handler: TransactionalHandler<unknown>) =>
          handler({
            findOne: jest.fn().mockResolvedValue(null),
            create: jest.fn(),
            persist: jest.fn().mockReturnValue({ flush: jest.fn() }),
            flush: jest.fn(),
          }),
      );

      await expect(
        service.createForBookingFromTemplate(
          'missing-booking',
          { templateId: 'template-id', amountCents: 1000, currency: 'USD' },
          { id: 'trainer-id', role: UserRole.TRAINER },
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should throw BadRequestException when booking is PENDING', async () => {
      const booking = {
        id: 'booking-id',
        status: BookingStatus.PENDING,
        trainer: { id: 'trainer-id' },
        trainee: { id: 'trainee-id' },
      } as unknown as Booking;
      em.transactional.mockImplementation(
        async (handler: TransactionalHandler<unknown>) =>
          handler({
            findOne: jest.fn().mockImplementation((entity: EntityClass) => {
              if (entity === Booking) return booking;
              if (entity === ExerciseTemplate)
                return {
                  id: 'template-id',
                  templateType: TemplateType.SYSTEM,
                  isDeleted: false,
                  createdBy: { id: 'admin-id' },
                  items: createItemsCollection([]),
                } as unknown as ExerciseTemplate;
              return null;
            }),
            create: jest.fn(),
            persist: jest.fn().mockReturnValue({ flush: jest.fn() }),
            flush: jest.fn(),
          }),
      );

      await expect(
        service.createForBookingFromTemplate(
          'booking-id',
          { templateId: 'template-id', amountCents: 1000 },
          { id: 'trainer-id', role: UserRole.TRAINER },
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
