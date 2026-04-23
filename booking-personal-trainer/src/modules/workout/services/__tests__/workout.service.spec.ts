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
import { WorkoutStatus } from '../../../../common/enums/workout/workout.enum';
import type { User } from '../../../user/entities/user.entity';

const createItemsCollection = <T>(items: T[]): { getItems: () => T[] } => ({
  getItems: () => items,
});

type ExercisesCollectionMock<T> = {
  readonly getItems: () => T[];
  readonly add?: jest.Mock;
};

const createExercisesCollection = <T>(
  items: readonly T[],
): ExercisesCollectionMock<T> => ({
  getItems: () => [...items],
  add: jest.fn(),
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

  afterEach(() => {
    delete process.env.DEFAULT_WORKOUT_PRICE_CENTS;
    delete process.env.FRONTEND_URL;
  });

  describe('create', () => {
    it('should throw NotFoundException when trainer missing', async () => {
      userService.findByIdOrNull.mockResolvedValueOnce(null);

      await expect(
        service.create('trainer-id', {
          traineeId: 'trainee-id',
          startTime: '2026-01-01T10:00:00.000Z',
          endTime: '2026-01-01T11:00:00.000Z',
          exerciseIds: [],
          amountCents: 1000,
          currency: 'USD',
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should throw NotFoundException when trainee missing', async () => {
      userService.findByIdOrNull
        .mockResolvedValueOnce({ id: 'trainer-id', userName: 't' })
        .mockResolvedValueOnce(null);

      await expect(
        service.create('trainer-id', {
          traineeId: 'trainee-id',
          startTime: '2026-01-01T10:00:00.000Z',
          endTime: '2026-01-01T11:00:00.000Z',
          exerciseIds: [],
          amountCents: 1000,
          currency: 'USD',
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should create workout and trigger billing + notifications + email', async () => {
      const trainer = { id: 'trainer-id', userName: 'trainer' };
      const trainee = {
        id: 'trainee-id',
        userName: 'trainee',
        email: 'trainee@test.com',
      };
      userService.findByIdOrNull
        .mockResolvedValueOnce(trainer)
        .mockResolvedValueOnce(trainee);
      workoutRepository.create.mockResolvedValue({
        id: 'workout-id',
        booking: null,
        template: null,
        startTime: new Date('2026-01-01T10:00:00.000Z'),
        endTime: new Date('2026-01-01T11:00:00.000Z'),
        status: WorkoutStatus.PENDING,
        trainer,
        trainee,
        exercises: createExercisesCollection([]),
      });

      const actual = await service.create('trainer-id', {
        traineeId: 'trainee-id',
        startTime: '2026-01-01T10:00:00.000Z',
        endTime: '2026-01-01T11:00:00.000Z',
        exerciseIds: [],
        amountCents: 1500,
        currency: 'USD',
      });

      expect(workoutRepository.create).toHaveBeenCalled();
      expect(billingService.createWorkoutCharge).toHaveBeenCalled();
      expect(billingService.activateCharge).toHaveBeenCalledWith('charge-id');
      expect(notificationsService.createAndPublishToUsers).toHaveBeenCalled();
      expect(emailService.send).toHaveBeenCalledWith(
        expect.objectContaining({ to: 'trainee@test.com' }),
      );
      expect(actual.id).toBe('workout-id');
    });
  });

  describe('getAll', () => {
    it('should scope to trainee workouts for TRAINEE user', async () => {
      const currentUser: User = {
        id: 'trainee-id',
        role: UserRole.TRAINEE,
      } as unknown as User;
      workoutRepository.findAndCount.mockResolvedValue([[], 0]);

      const actual = await service.getAll({ page: 1, limit: 20 }, currentUser);

      expect(workoutRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          isDeleted: false,
          traineeId: 'trainee-id',
        }),
        expect.any(Object),
      );
      expect(actual.data).toEqual([]);
    });

    it('should scope to trainer workouts for TRAINER user and allow traineeId filter', async () => {
      const currentUser: User = {
        id: 'trainer-id',
        role: UserRole.TRAINER,
      } as unknown as User;
      workoutRepository.findAndCount.mockResolvedValue([[], 0]);

      await service.getAll(
        { page: 1, limit: 20, traineeId: 'trainee-id' },
        currentUser,
      );

      expect(workoutRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          isDeleted: false,
          trainerId: 'trainer-id',
          traineeId: 'trainee-id',
        }),
        expect.any(Object),
      );
    });

    it('should allow admin to filter by trainerId and traineeId', async () => {
      const currentUser: User = {
        id: 'admin-id',
        role: UserRole.ADMIN,
      } as unknown as User;
      workoutRepository.findAndCount.mockResolvedValue([[], 0]);

      await service.getAll(
        { page: 1, limit: 20, trainerId: 't1', traineeId: 'u1' },
        currentUser,
      );

      expect(workoutRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          isDeleted: false,
          trainerId: 't1',
          traineeId: 'u1',
        }),
        expect.any(Object),
      );
    });

    it('should hide exercises for trainee when unpaid', async () => {
      const currentUser: User = {
        id: 'trainee-id',
        role: UserRole.TRAINEE,
      } as unknown as User;
      workoutRepository.findAndCount.mockResolvedValue([
        [
          {
            id: 'w1',
            booking: null,
            template: { id: 'tpl', name: 'T' },
            startTime: new Date(),
            endTime: new Date(),
            status: WorkoutStatus.PENDING,
            trainer: { id: 'trainer-id' },
            trainee: { id: 'trainee-id' },
            exercises: createExercisesCollection([
              { id: 'we1', isCompleted: false },
            ]),
          },
        ],
        1,
      ]);
      workoutPaymentPolicyService.isWorkoutPaid.mockResolvedValue(false);

      const actual = await service.getAll({ page: 1, limit: 20 }, currentUser);

      expect(actual.data[0]?.exercises).toEqual([]);
      expect(actual.data[0]?.templateId).toBeNull();
      expect(actual.data[0]?.totalExercises).toBeUndefined();
      expect(actual.data[0]?.completedExercises).toBeUndefined();
    });
  });

  describe('getOneForUser', () => {
    it('should throw NotFoundException when workout missing', async () => {
      workoutRepository.findByIdWithExercises.mockResolvedValue(null);
      const currentUser: User = {
        id: 'u1',
        role: UserRole.ADMIN,
      } as unknown as User;

      await expect(
        service.getOneForUser('missing', currentUser),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should throw BadRequestException when user is not admin/trainer/trainee of workout', async () => {
      workoutRepository.findByIdWithExercises.mockResolvedValue({
        id: 'w1',
        trainer: { id: 't1' },
        trainee: { id: 'u1' },
        exercises: createExercisesCollection([]),
      });
      const currentUser: User = {
        id: 'intruder',
        role: UserRole.TRAINEE,
      } as unknown as User;

      await expect(
        service.getOneForUser('w1', currentUser),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should hide exercises for trainee when unpaid', async () => {
      workoutRepository.findByIdWithExercises.mockResolvedValue({
        id: 'w1',
        booking: null,
        template: { id: 'tpl', name: 'T' },
        startTime: new Date(),
        endTime: new Date(),
        status: WorkoutStatus.PENDING,
        trainer: { id: 't1' },
        trainee: { id: 'u1' },
        exercises: createExercisesCollection([
          { id: 'we1', isCompleted: false },
        ]),
      });
      workoutPaymentPolicyService.isWorkoutPaid.mockResolvedValue(false);

      const currentUser: User = {
        id: 'u1',
        role: UserRole.TRAINEE,
      } as unknown as User;
      const actual = await service.getOneForUser('w1', currentUser);

      expect(actual.exercises).toEqual([]);
      expect(actual.templateId).toBeNull();
    });
  });

  describe('updateDetail', () => {
    it('should throw NotFoundException when workout missing', async () => {
      workoutRepository.findByIdWithExercises.mockResolvedValue(null);
      const currentUser: User = {
        id: 'admin-id',
        role: UserRole.ADMIN,
      } as unknown as User;

      await expect(
        service.updateDetail(
          'missing',
          { status: WorkoutStatus.PENDING },
          currentUser,
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should throw BadRequestException when trainer is not owner', async () => {
      workoutRepository.findByIdWithExercises.mockResolvedValue({
        id: 'w1',
        trainer: { id: 'other-trainer' },
        trainee: { id: 'u1' },
        exercises: createExercisesCollection([]),
      });
      const currentUser: User = {
        id: 'trainer-id',
        role: UserRole.TRAINER,
      } as unknown as User;

      await expect(
        service.updateDetail(
          'w1',
          { status: WorkoutStatus.PENDING },
          currentUser,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should throw when trying to set IN_PROGRESS and workout is unpaid', async () => {
      workoutRepository.findByIdWithExercises.mockResolvedValue({
        id: 'w1',
        trainer: { id: 'trainer-id' },
        trainee: { id: 'u1' },
        exercises: createExercisesCollection([]),
      });
      workoutPaymentPolicyService.isWorkoutPaid.mockResolvedValue(false);

      await expect(
        service.updateDetail(
          'w1',
          { status: WorkoutStatus.IN_PROGRESS, exerciseCompletions: [] },
          { id: 'trainer-id', role: UserRole.TRAINER } as unknown as User,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should update status and completions when valid', async () => {
      workoutRepository.findByIdWithExercises.mockResolvedValue({
        id: 'w1',
        trainer: { id: 'trainer-id' },
        trainee: { id: 'u1' },
        exercises: createExercisesCollection([]),
      });
      workoutPaymentPolicyService.isWorkoutPaid.mockResolvedValue(true);
      workoutRepository.updateStatusAndCompletions.mockResolvedValue({
        id: 'w1',
        booking: null,
        template: null,
        startTime: new Date(),
        endTime: new Date(),
        status: WorkoutStatus.IN_PROGRESS,
        trainer: { id: 'trainer-id' },
        trainee: { id: 'u1' },
        exercises: createExercisesCollection([]),
      });

      const actual = await service.updateDetail(
        'w1',
        { status: WorkoutStatus.IN_PROGRESS, exerciseCompletions: [] },
        { id: 'trainer-id', role: UserRole.TRAINER } as unknown as User,
      );

      expect(workoutRepository.updateStatusAndCompletions).toHaveBeenCalledWith(
        'w1',
        WorkoutStatus.IN_PROGRESS,
        [],
      );
      expect(actual.status).toBe(WorkoutStatus.IN_PROGRESS);
    });
  });

  describe('removeAll', () => {
    it('should return message with deleted count', async () => {
      workoutRepository.removeAll.mockResolvedValue(3);

      const actual = await service.removeAll();

      expect(actual.message).toBe('Deleted 3 workouts');
    });
  });

  describe('softDelete', () => {
    it('should throw NotFoundException when workout missing', async () => {
      workoutRepository.findByIdWithExercises.mockResolvedValue(null);

      await expect(service.softDelete('missing')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('should call repo.softDelete when exists', async () => {
      workoutRepository.findByIdWithExercises.mockResolvedValue({
        id: 'w1',
        exercises: createExercisesCollection([]),
      });
      workoutRepository.softDelete.mockResolvedValue(undefined);

      await service.softDelete('w1');

      expect(workoutRepository.softDelete).toHaveBeenCalledWith('w1');
    });
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

    it('should throw BadRequestException when non-admin tries to create for another trainer booking', async () => {
      const booking = {
        id: 'booking-id',
        status: BookingStatus.CONFIRMED,
        trainer: { id: 'other-trainer' },
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

    it('should throw NotFoundException when template missing', async () => {
      const booking = {
        id: 'booking-id',
        status: BookingStatus.CONFIRMED,
        trainer: { id: 'trainer-id' },
        trainee: { id: 'trainee-id' },
      } as unknown as Booking;
      em.transactional.mockImplementation(
        async (handler: TransactionalHandler<unknown>) =>
          handler({
            findOne: jest.fn().mockImplementation((entity: EntityClass) => {
              if (entity === Booking) return booking;
              if (entity === ExerciseTemplate) return null;
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
          { templateId: 'missing', amountCents: 1000 },
          { id: 'trainer-id', role: UserRole.TRAINER },
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should block using trainer template not owned by current trainer', async () => {
      const booking = {
        id: 'booking-id',
        status: BookingStatus.CONFIRMED,
        trainer: { id: 'trainer-id' },
        trainee: { id: 'trainee-id' },
      } as unknown as Booking;
      const template = {
        id: 'template-id',
        templateType: TemplateType.TRAINER,
        isDeleted: false,
        createdBy: { id: 'other-trainer' },
        items: createItemsCollection([]),
      } as unknown as ExerciseTemplate;
      em.transactional.mockImplementation(
        async (handler: TransactionalHandler<unknown>) =>
          handler({
            findOne: jest.fn().mockImplementation((entity: EntityClass) => {
              if (entity === Booking) return booking;
              if (entity === ExerciseTemplate) return template;
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

    it('should throw BadRequestException when unique violation occurs', async () => {
      const uniqueErr = Object.assign(new Error('unique violation'), {
        code: '23505' as const,
      });
      em.transactional.mockImplementation(() => Promise.reject(uniqueErr));

      await expect(
        service.createForBookingFromTemplate(
          'booking-id',
          { templateId: 'template-id', amountCents: 1000 },
          { id: 'trainer-id', role: UserRole.TRAINER },
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should not throw when side effects fail after creation', async () => {
      const booking = {
        id: 'booking-id',
        status: BookingStatus.CONFIRMED,
        startTime: new Date('2026-01-01T10:00:00.000Z'),
        endTime: new Date('2026-01-01T11:00:00.000Z'),
        trainer: { id: 'trainer-id', userName: 'trainer' },
        trainee: { id: 'trainee-id', userName: 'trainee', email: 't@test.com' },
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
        startTime: booking.startTime,
        endTime: booking.endTime,
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
          }),
      );
      bookingService.findBookingById.mockRejectedValue(new Error('boom'));

      const actual = await service.createForBookingFromTemplate(
        'booking-id',
        { templateId: 'template-id', amountCents: 1000, currency: 'USD' },
        { id: 'trainer-id', role: UserRole.TRAINER },
      );

      expect(actual.id).toBe('workout-id');
    });

    it('should throw when amountCents missing and DEFAULT_WORKOUT_PRICE_CENTS unset', async () => {
      delete process.env.DEFAULT_WORKOUT_PRICE_CENTS;

      await expect(
        service.createForBookingFromTemplate(
          'booking-id',
          { templateId: 'template-id' },
          { id: 'admin-id', role: UserRole.ADMIN },
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should throw when DEFAULT_WORKOUT_PRICE_CENTS is invalid', async () => {
      process.env.DEFAULT_WORKOUT_PRICE_CENTS = '0';

      await expect(
        service.createForBookingFromTemplate(
          'booking-id',
          { templateId: 'template-id' },
          { id: 'admin-id', role: UserRole.ADMIN },
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
