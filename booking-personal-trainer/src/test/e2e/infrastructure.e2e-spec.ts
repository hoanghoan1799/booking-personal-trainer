import { INestApplication } from '@nestjs/common';
import { MikroORM } from '@mikro-orm/core';
import request from 'supertest';

// Enums
import { UserType } from '../../common/enums/user/user.enum';
import {
  createInfrastructureTestApp,
  teardownTestApp,
} from '../setup/test-app.factory';
import { E2E_API_V1_ROOT } from '../utils/helpers';

const HTTP_STATUS = {
  UNAUTHORIZED: 401,
  NO_CONTENT: 204,
  CREATED: 201,
  TOO_MANY_REQUESTS: 429,
} as const;

const ALLOWED_ORIGIN = 'http://localhost:3000';

const REGISTER_BURST_LIMIT_IP = 3;
const REQUESTS_TO_EXCEED_BURST = REGISTER_BURST_LIMIT_IP + 1;

const createRegisterBody = () => ({
  email: `e2e-infra-${Date.now()}-${Math.random().toString(36).slice(2, 9)}@test.com`,
  password: 'Password123!',
  userName: `e2einfra${Date.now()}${Math.random().toString(36).slice(2, 9)}`,
  firstName: 'E2E',
  lastName: 'Infra',
  userType: UserType.TRAINEE,
});

describe('Infrastructure (e2e)', () => {
  let app!: INestApplication;
  let orm!: MikroORM;
  const profilePath = `${E2E_API_V1_ROOT}/auth/profile`;
  const registerPath = `${E2E_API_V1_ROOT}/auth/register`;

  beforeAll(async () => {
    const t = await createInfrastructureTestApp();
    app = t.app;
    orm = t.orm;
  });

  afterAll(async () => {
    await teardownTestApp({ app, orm });
  });

  describe('Helmet (security headers)', () => {
    it('should set x-content-type-options header', async () => {
      const res = await request(
        app.getHttpServer() as Parameters<typeof request>[0],
      )
        .get(profilePath)
        .expect(HTTP_STATUS.UNAUTHORIZED);
      expect(res.headers['x-content-type-options']).toBe('nosniff');
    });

    it('should set x-frame-options header', async () => {
      const res = await request(
        app.getHttpServer() as Parameters<typeof request>[0],
      )
        .get(profilePath)
        .expect(HTTP_STATUS.UNAUTHORIZED);
      expect(res.headers['x-frame-options']).toBeDefined();
    });

    it('should set content-security-policy header', async () => {
      const res = await request(
        app.getHttpServer() as Parameters<typeof request>[0],
      )
        .get(profilePath)
        .expect(HTTP_STATUS.UNAUTHORIZED);
      expect(res.headers['content-security-policy']).toBeDefined();
    });
  });

  describe('CORS', () => {
    it('should return Access-Control-Allow-Origin for allowed origin', async () => {
      const res = await request(
        app.getHttpServer() as Parameters<typeof request>[0],
      )
        .get(profilePath)
        .set('Origin', ALLOWED_ORIGIN)
        .expect(HTTP_STATUS.UNAUTHORIZED);
      expect(res.headers['access-control-allow-origin']).toBe(ALLOWED_ORIGIN);
    });

    it('should allow preflight OPTIONS request', async () => {
      const res = await request(
        app.getHttpServer() as Parameters<typeof request>[0],
      )
        .options(registerPath)
        .set('Origin', ALLOWED_ORIGIN)
        .set('Access-Control-Request-Method', 'POST')
        .set('Access-Control-Request-Headers', 'Content-Type')
        .expect(HTTP_STATUS.NO_CONTENT);
      expect(res.headers['access-control-allow-origin']).toBe(ALLOWED_ORIGIN);
      expect(res.headers['access-control-allow-methods']).toBeDefined();
    });
  });

  describe('Rate limiting', () => {
    it('should return 429 when exceeding burst limit on register', async () => {
      const http = app.getHttpServer() as Parameters<typeof request>[0];
      const statuses: number[] = [];
      for (let i = 0; i < REQUESTS_TO_EXCEED_BURST; i++) {
        const res = await request(http)
          .post(registerPath)
          .send(createRegisterBody());
        statuses.push(res.status);
      }
      expect(statuses).toContain(HTTP_STATUS.TOO_MANY_REQUESTS);
    });
  });
});
