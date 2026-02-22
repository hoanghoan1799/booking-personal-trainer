import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { VersioningType } from '@nestjs/common';
import helmet from 'helmet';
import request from 'supertest';

// Constants
import { API_PREFIX } from '../common/constants/app.constant';

// Configs
import { CORS_CONFIG } from '../configs/cors.config';
import { HELMET_CONFIG } from '../configs/helmet.config';
import { GLOBAL_PIPE_CONFIG } from '../configs/pipe.config';

// Modules
import { AppModule } from '../app.module';

// Enums
import { UserType } from '../common/enums/user/user.enum';

const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  TOO_MANY_REQUESTS: 429,
} as const;

const API_VERSION_PATH = '/api/v1';
const AUTH_REGISTER_PATH = `${API_VERSION_PATH}/auth/register`;

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

/**
 * E2E tests for infrastructure: Helmet, CORS, Rate Limiting.
 * Requires test database and Redis.
 */
describe('Infrastructure (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.use(helmet(HELMET_CONFIG as Parameters<typeof helmet>[0]));
    app.enableCors(CORS_CONFIG);

    app.setGlobalPrefix(API_PREFIX);
    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: '1',
    });
    app.useGlobalPipes(GLOBAL_PIPE_CONFIG);

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Helmet (security headers)', () => {
    it('should set x-content-type-options header', async () => {
      const httpServer = app.getHttpServer() as Parameters<typeof request>[0];
      const res = await request(httpServer)
        .get(`${API_VERSION_PATH}/auth/profile`)
        .expect(401);

      expect(res.headers['x-content-type-options']).toBe('nosniff');
    });

    it('should set x-frame-options header', async () => {
      const httpServer = app.getHttpServer() as Parameters<typeof request>[0];
      const res = await request(httpServer)
        .get(`${API_VERSION_PATH}/auth/profile`)
        .expect(401);

      expect(res.headers['x-frame-options']).toBeDefined();
    });

    it('should set content-security-policy header', async () => {
      const httpServer = app.getHttpServer() as Parameters<typeof request>[0];
      const res = await request(httpServer)
        .get(`${API_VERSION_PATH}/auth/profile`)
        .expect(401);

      expect(res.headers['content-security-policy']).toBeDefined();
    });
  });

  describe('CORS', () => {
    it('should return Access-Control-Allow-Origin for allowed origin', async () => {
      const httpServer = app.getHttpServer() as Parameters<typeof request>[0];
      const res = await request(httpServer)
        .get(`${API_VERSION_PATH}/auth/profile`)
        .set('Origin', ALLOWED_ORIGIN)
        .expect(401);

      expect(res.headers['access-control-allow-origin']).toBe(ALLOWED_ORIGIN);
    });

    it('should allow preflight OPTIONS request', async () => {
      const httpServer = app.getHttpServer() as Parameters<typeof request>[0];
      const res = await request(httpServer)
        .options(AUTH_REGISTER_PATH)
        .set('Origin', ALLOWED_ORIGIN)
        .set('Access-Control-Request-Method', 'POST')
        .set('Access-Control-Request-Headers', 'Content-Type')
        .expect(204);

      expect(res.headers['access-control-allow-origin']).toBe(ALLOWED_ORIGIN);
      expect(res.headers['access-control-allow-methods']).toBeDefined();
    });
  });

  describe('Rate limiting', () => {
    it('should return 429 when exceeding burst limit on register', async () => {
      const httpServer = app.getHttpServer() as Parameters<typeof request>[0];
      const statuses: number[] = [];

      for (let i = 0; i < REQUESTS_TO_EXCEED_BURST; i++) {
        const res = await request(httpServer)
          .post(AUTH_REGISTER_PATH)
          .send(createRegisterBody());
        statuses.push(res.status);
      }

      expect(statuses).toContain(HTTP_STATUS.TOO_MANY_REQUESTS);
    });
  });
});
