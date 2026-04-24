import { INestApplication } from '@nestjs/common';
import { MikroORM } from '@mikro-orm/core';
import request from 'supertest';

// Enums
import { BookingStatus } from '../../common/enums/booking/booking.enum';

// Factories
import { createTestTrainer } from '../factories/user.factory';
import { createTestTrainee } from '../factories/user.factory';
import { createTestTrainerAvailability } from '../factories/trainer-availability.factory';
import { resetE2EProviderMocks } from '../setup/mock-providers';
import { cleanDatabase } from '../setup/test-database';
import {
  createTestApp,
  setTestUser,
  teardownTestApp,
} from '../setup/test-app.factory';
import { getForkedEntityManager } from '../utils/db';
import {
  buildFutureBookingTimeRange,
  buildSecondFutureBookingTimeRange,
  e2ePath,
} from '../utils/helpers';

const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
} as const;

const BOOKINGS_PATH = e2ePath('/bookings');

describe('Booking (e2e)', () => {
  let app!: INestApplication;
  let orm!: MikroORM;

  beforeAll(async () => {
    const test = await createTestApp();
    app = test.app;
    orm = test.orm;
  });

  afterAll(async () => {
    await teardownTestApp({ app, orm });
    jest.restoreAllMocks();
  });

  beforeEach(async () => {
    await cleanDatabase(orm);
    resetE2EProviderMocks();
  });

  describe('POST /bookings', () => {
    it('should return 401 when no token', async () => {
      setTestUser(null);
      const { startTime, endTime } = buildFutureBookingTimeRange();
      await request(app.getHttpServer() as Parameters<typeof request>[0])
        .post(BOOKINGS_PATH)
        .send({
          trainerId: '00000000-0000-0000-0000-000000000001',
          startTime,
          endTime,
        })
        .expect(HTTP_STATUS.UNAUTHORIZED);
    });

    it('should create a booking and return 201', async () => {
      const em = getForkedEntityManager(orm);
      const trainee = await createTestTrainee(em);
      const trainer = await createTestTrainer(em);
      const { startTime, endTime } = buildFutureBookingTimeRange();
      await createTestTrainerAvailability(em, {
        trainer,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
      });
      setTestUser(trainee);
      const res = await request(
        app.getHttpServer() as Parameters<typeof request>[0],
      )
        .post(BOOKINGS_PATH)
        .send({ trainerId: trainer.id, startTime, endTime })
        .expect(HTTP_STATUS.CREATED);
      const body = res.body as { data: { id: string; status: string } };
      expect(body.data).toHaveProperty('id');
      expect(body.data).toHaveProperty('status', BookingStatus.PENDING);
    });

    it('should return 400 when time range is invalid', async () => {
      const em = getForkedEntityManager(orm);
      const trainee = await createTestTrainee(em);
      const trainer = await createTestTrainer(em);
      const { startTime, endTime } = buildFutureBookingTimeRange();
      setTestUser(trainee);
      await request(app.getHttpServer() as Parameters<typeof request>[0])
        .post(BOOKINGS_PATH)
        .send({ trainerId: trainer.id, endTime: startTime, startTime: endTime })
        .expect(HTTP_STATUS.BAD_REQUEST);
    });
  });

  describe('GET /bookings', () => {
    it('should return 200 and list for authenticated user', async () => {
      const em = getForkedEntityManager(orm);
      const trainee = await createTestTrainee(em);
      setTestUser(trainee);
      const res = await request(
        app.getHttpServer() as Parameters<typeof request>[0],
      )
        .get(BOOKINGS_PATH)
        .expect(HTTP_STATUS.OK);
      const body = res.body as { data: unknown[]; meta: unknown };
      expect(body).toHaveProperty('data');
      expect(body).toHaveProperty('meta');
      expect(Array.isArray(body.data)).toBe(true);
    });

    it('should return 401 when no token', async () => {
      setTestUser(null);
      await request(app.getHttpServer() as Parameters<typeof request>[0])
        .get(BOOKINGS_PATH)
        .expect(HTTP_STATUS.UNAUTHORIZED);
    });
  });

  describe('PATCH /bookings/:id/status', () => {
    it('should return 400 when trainee attempts to confirm (not admin nor trainer of booking)', async () => {
      const em = getForkedEntityManager(orm);
      const trainee = await createTestTrainee(em);
      const trainer = await createTestTrainer(em);
      const { startTime, endTime } = buildSecondFutureBookingTimeRange();
      await createTestTrainerAvailability(em, {
        trainer,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
      });
      setTestUser(trainee);
      const http = app.getHttpServer() as Parameters<typeof request>[0];
      const createRes = await request(http)
        .post(BOOKINGS_PATH)
        .send({ trainerId: trainer.id, startTime, endTime })
        .expect(HTTP_STATUS.CREATED);
      const id = (createRes.body as { data: { id: string } }).data.id;
      setTestUser(trainee);
      await request(http)
        .patch(`${BOOKINGS_PATH}/${id}/status`)
        .send({ status: BookingStatus.CONFIRMED })
        .expect(HTTP_STATUS.BAD_REQUEST);
    });
  });
});
