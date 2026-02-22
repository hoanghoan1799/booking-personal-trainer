import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { VersioningType } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import request from 'supertest';

// Constants
import { API_PREFIX } from '../common/constants/app.constant';

// Configs
import { GLOBAL_PIPE_CONFIG } from '../configs/pipe.config';

// Modules
import { AppModule } from '../app.module';

// Enums
import { UserType } from '../common/enums/user/user.enum';
import { BookingStatus } from '../common/enums/booking/booking.enum';

const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
} as const;

const API_VERSION_PATH = '/api/v1';
const BOOKINGS_PATH = `${API_VERSION_PATH}/bookings`;
const AUTH_PATH = `${API_VERSION_PATH}/auth`;

const HOURS_OFFSET_FOR_FUTURE_BOOKING = 2;
const HOURS_DURATION_BOOKING = 1;
const HOURS_OFFSET_FOR_SECOND_BOOKING = 4;

interface AuthRegisterResponse {
  data: {
    accessToken: string;
    user: { id: string };
  };
}

interface BookingResponse {
  data: {
    id: string;
    status: string;
    trainer: unknown;
    trainee: unknown;
  };
}

interface BookingsListResponse {
  data: unknown[];
  meta: unknown;
}

/**
 * E2E tests for Booking API.
 * Require test database and Redis.
 */
describe('Booking (e2e)', () => {
  let app: INestApplication;
  let traineeToken: string;
  let trainerId: string;
  let trainerToken: string;
  let bookingId: string;

  const traineePayload = {
    email: `e2e-trainee-${Date.now()}@test.com`,
    password: 'Password123!',
    userName: `e2etrainee${Date.now()}`,
    firstName: 'E2E',
    lastName: 'Trainee',
    userType: UserType.TRAINEE,
  };

  const trainerPayload = {
    email: `e2e-trainer-${Date.now()}@test.com`,
    password: 'Password123!',
    userName: `e2etrainer${Date.now()}`,
    firstName: 'E2E',
    lastName: 'Trainer',
    userType: UserType.TRAINER,
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(APP_GUARD)
      .useValue({ canActivate: () => Promise.resolve(true) })
      .compile();

    app = moduleFixture.createNestApplication();

    app.setGlobalPrefix(API_PREFIX);
    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: '1',
    });
    app.useGlobalPipes(GLOBAL_PIPE_CONFIG);

    await app.init();

    const httpServer = app.getHttpServer() as Parameters<typeof request>[0];
    const traineeRes = await request(httpServer)
      .post(`${AUTH_PATH}/register`)
      .send(traineePayload)
      .expect(HTTP_STATUS.CREATED);
    const traineeData = (traineeRes.body as AuthRegisterResponse).data;
    traineeToken = traineeData.accessToken;

    const trainerRes = await request(httpServer)
      .post(`${AUTH_PATH}/register`)
      .send(trainerPayload)
      .expect(HTTP_STATUS.CREATED);
    const trainerData = (trainerRes.body as AuthRegisterResponse).data;
    trainerToken = trainerData.accessToken;
    trainerId = trainerData.user.id;
  });

  afterAll(async () => {
    await app.close();
  });

  const futureStartEnd = (): { startTime: string; endTime: string } => {
    const start = new Date();
    start.setHours(start.getHours() + HOURS_OFFSET_FOR_FUTURE_BOOKING, 0, 0, 0);
    const end = new Date(start);
    end.setHours(end.getHours() + HOURS_DURATION_BOOKING, 0, 0, 0);
    return {
      startTime: start.toISOString(),
      endTime: end.toISOString(),
    };
  };

  describe('POST /bookings', () => {
    it('should return 401 when no token', async () => {
      const { startTime, endTime } = futureStartEnd();
      const httpServer = app.getHttpServer() as Parameters<typeof request>[0];
      await request(httpServer)
        .post(BOOKINGS_PATH)
        .send({ trainerId, startTime, endTime })
        .expect(HTTP_STATUS.UNAUTHORIZED);
    });

    it('should create a booking and return 201', async () => {
      const { startTime, endTime } = futureStartEnd();
      const httpServer = app.getHttpServer() as Parameters<typeof request>[0];
      const res = await request(httpServer)
        .post(BOOKINGS_PATH)
        .set('Authorization', `Bearer ${traineeToken}`)
        .send({ trainerId, startTime, endTime })
        .expect(HTTP_STATUS.CREATED);

      const data = (res.body as BookingResponse).data;
      expect(data).toHaveProperty('id');
      expect(data).toHaveProperty('status', BookingStatus.PENDING);
      expect(data).toHaveProperty('trainer');
      expect(data).toHaveProperty('trainee');
      bookingId = data.id;
    });

    it('should return 400 when time range is invalid', async () => {
      const { startTime, endTime } = futureStartEnd();
      const httpServer = app.getHttpServer() as Parameters<typeof request>[0];
      await request(httpServer)
        .post(BOOKINGS_PATH)
        .set('Authorization', `Bearer ${traineeToken}`)
        .send({ trainerId, endTime: startTime, startTime: endTime })
        .expect(HTTP_STATUS.BAD_REQUEST);
    });
  });

  describe('GET /bookings', () => {
    it('should return 200 and list for authenticated user', async () => {
      const httpServer = app.getHttpServer() as Parameters<typeof request>[0];
      const res = await request(httpServer)
        .get(BOOKINGS_PATH)
        .set('Authorization', `Bearer ${traineeToken}`)
        .expect(HTTP_STATUS.OK);

      const body = res.body as BookingsListResponse;
      expect(body).toHaveProperty('data');
      expect(body).toHaveProperty('meta');
      expect(Array.isArray(body.data)).toBe(true);
    });

    it('should return 401 when no token', async () => {
      const httpServer = app.getHttpServer() as Parameters<typeof request>[0];
      await request(httpServer)
        .get(BOOKINGS_PATH)
        .expect(HTTP_STATUS.UNAUTHORIZED);
    });
  });

  describe('PATCH /bookings/:id/status', () => {
    it('should return 403 when user without TRAINER/ADMIN role updates status', async () => {
      if (!bookingId) return;
      const httpServer = app.getHttpServer() as Parameters<typeof request>[0];
      await request(httpServer)
        .patch(`${BOOKINGS_PATH}/${bookingId}/status`)
        .set('Authorization', `Bearer ${trainerToken}`)
        .send({ status: BookingStatus.CONFIRMED })
        .expect(HTTP_STATUS.FORBIDDEN);
    });

    it('should return 403 when trainee tries to update status', async () => {
      const start = new Date();
      start.setHours(
        start.getHours() + HOURS_OFFSET_FOR_SECOND_BOOKING,
        0,
        0,
        0,
      );
      const end = new Date(start);
      end.setHours(end.getHours() + HOURS_DURATION_BOOKING, 0, 0, 0);
      const httpServer = app.getHttpServer() as Parameters<typeof request>[0];
      const createRes = await request(httpServer)
        .post(BOOKINGS_PATH)
        .set('Authorization', `Bearer ${traineeToken}`)
        .send({
          trainerId,
          startTime: start.toISOString(),
          endTime: end.toISOString(),
        })
        .expect(HTTP_STATUS.CREATED);
      const id = (createRes.body as BookingResponse).data.id;

      await request(httpServer)
        .patch(`${BOOKINGS_PATH}/${id}/status`)
        .set('Authorization', `Bearer ${traineeToken}`)
        .send({ status: BookingStatus.CONFIRMED })
        .expect(HTTP_STATUS.FORBIDDEN);
    });
  });
});
