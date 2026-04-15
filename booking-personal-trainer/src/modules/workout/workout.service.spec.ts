/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';

import { UserRole } from '../../common/enums/user/user.enum';
import { BookingStatus } from '../../common/enums/booking/booking.enum';
import { TemplateType } from '../templates/enums/template-type.enum';

import { WorkoutService } from './workout.service';
import { WorkoutRepositoryToken } from './repositories/workout.repository.interface';
import { UserRepositoryToken } from '../user/repositories/user.repository.interface';
import { BookingRepositoryToken } from '../booking/repositories/booking.repository.interface';
import { TemplatesRepositoryToken } from '../templates/repositories/templates.repository.interface';
import { WorkoutPaymentPolicyService } from '../payments/workout-payment-policy.service';
import { BillingService } from '../billing/billing.service';

const createItemsCollection = <T>(items: T[]): { getItems: () => T[] } => ({
  getItems: () => items,
});

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
  let bookingRepository: { findById: jest.Mock };
  let templatesRepository: { findTemplateById: jest.Mock };
  let userRepository: { findById: jest.Mock };
  let workoutPaymentPolicyService: { isWorkoutPaid: jest.Mock };
  let billingService: {
    createWorkoutCharge: jest.Mock;
    activateCharge: jest.Mock;
  };

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
    bookingRepository = { findById: jest.fn() };
    templatesRepository = { findTemplateById: jest.fn() };
    userRepository = { findById: jest.fn() };
    workoutPaymentPolicyService = { isWorkoutPaid: jest.fn() };
    billingService = {
      createWorkoutCharge: jest.fn().mockResolvedValue({ id: 'charge-id' }),
      activateCharge: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkoutService,
        { provide: WorkoutRepositoryToken, useValue: workoutRepository },
        { provide: BookingRepositoryToken, useValue: bookingRepository },
        { provide: TemplatesRepositoryToken, useValue: templatesRepository },
        { provide: UserRepositoryToken, useValue: userRepository },
        {
          provide: WorkoutPaymentPolicyService,
          useValue: workoutPaymentPolicyService,
        },
        { provide: BillingService, useValue: billingService },
      ],
    }).compile();

    service = module.get<WorkoutService>(WorkoutService);
  });

  describe('createForBookingFromTemplate', () => {
    it('should create workout for confirmed booking from SYSTEM template', async () => {
      bookingRepository.findById.mockResolvedValue({
        id: 'booking-id',
        status: BookingStatus.CONFIRMED,
        startTime: new Date('2026-01-01T10:00:00.000Z'),
        endTime: new Date('2026-01-01T11:00:00.000Z'),
        trainer: { id: 'trainer-id' },
        trainee: { id: 'trainee-id' },
      });
      templatesRepository.findTemplateById.mockResolvedValue({
        id: 'template-id',
        templateType: TemplateType.SYSTEM,
        isDeleted: false,
        createdBy: { id: 'admin-id' },
        items: createItemsCollection([]),
      });
      workoutRepository.createFromBookingTemplate.mockResolvedValue({
        id: 'workout-id',
        booking: { id: 'booking-id' },
        template: { id: 'template-id' },
        startTime: new Date('2026-01-01T10:00:00.000Z'),
        endTime: new Date('2026-01-01T11:00:00.000Z'),
        status: 'PENDING',
        trainer: { id: 'trainer-id' },
        trainee: { id: 'trainee-id' },
        exercises: createItemsCollection([]),
      });

      const actual = await service.createForBookingFromTemplate(
        'booking-id',
        { templateId: 'template-id', amountCents: 2500, currency: 'USD' },
        { id: 'trainer-id', role: UserRole.TRAINER },
      );

      expect(workoutRepository.createFromBookingTemplate).toHaveBeenCalledWith({
        booking: expect.objectContaining({ id: 'booking-id' }),
        template: expect.objectContaining({ id: 'template-id' }),
      });
      expect(actual.id).toBe('workout-id');
      expect(actual.bookingId).toBe('booking-id');
      expect(actual.templateId).toBe('template-id');
      expect(billingService.createWorkoutCharge).toHaveBeenCalledWith(
        expect.objectContaining({
          workoutId: 'workout-id',
          payerUserId: 'trainee-id',
          amountCents: 2500,
          currency: 'USD',
        }),
      );
      expect(billingService.activateCharge).toHaveBeenCalledWith('charge-id');
    });

    it('should throw NotFoundException when booking missing', async () => {
      bookingRepository.findById.mockResolvedValue(null);

      await expect(
        service.createForBookingFromTemplate(
          'missing-booking',
          { templateId: 'template-id' },
          { id: 'trainer-id', role: UserRole.TRAINER },
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should throw BadRequestException when booking is PENDING', async () => {
      bookingRepository.findById.mockResolvedValue({
        id: 'booking-id',
        status: BookingStatus.PENDING,
        trainer: { id: 'trainer-id' },
        trainee: { id: 'trainee-id' },
      });
      templatesRepository.findTemplateById.mockResolvedValue({
        id: 'template-id',
        templateType: TemplateType.SYSTEM,
        isDeleted: false,
        createdBy: { id: 'admin-id' },
        items: createItemsCollection([]),
      });

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
