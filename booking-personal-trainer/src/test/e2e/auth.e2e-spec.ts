import { INestApplication } from '@nestjs/common';
import { MikroORM } from '@mikro-orm/core';
import request from 'supertest';

// Enums
import { UserType } from '../../common/enums/user/user.enum';
import {
  createAuthE2eTestApp,
  teardownTestApp,
} from '../setup/test-app.factory';
import { e2ePath } from '../utils/helpers';

const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
  CONFLICT: 409,
} as const;

const AUTH_BASE = e2ePath('/auth');

interface AuthRegisterResponse {
  data: {
    accessToken: string;
    refreshToken: string;
    user: { email: string; userName: string };
  };
}

interface AuthLoginResponse {
  data: {
    accessToken: string;
    user: { email: string };
  };
}

interface AuthProfileResponse {
  data: { email: string; userName: string };
}

interface ApiErrorResponse {
  message: string;
}

describe('Auth (e2e)', () => {
  let app!: INestApplication;
  let orm!: MikroORM;

  beforeAll(async () => {
    const t = await createAuthE2eTestApp();
    app = t.app;
    orm = t.orm;
  });

  afterAll(async () => {
    await teardownTestApp({ app, orm });
  });

  const createRegisterBody = () => ({
    email: `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 9)}@test.com`,
    password: 'Password123!',
    userName: `e2euser${Date.now()}${Math.random().toString(36).slice(2, 9)}`,
    firstName: 'E2E',
    lastName: 'User',
    userType: UserType.TRAINEE,
  });

  let sharedCredentials: { email: string; password: string };
  let sharedAccessToken: string;

  describe('POST /auth/register', () => {
    it('should register a new user and return tokens', async () => {
      const body = createRegisterBody();
      sharedCredentials = { email: body.email, password: body.password };
      const res = await request(
        app.getHttpServer() as Parameters<typeof request>[0],
      )
        .post(`${AUTH_BASE}/register`)
        .send(body)
        .expect(HTTP_STATUS.CREATED);
      const data = (res.body as AuthRegisterResponse).data;
      expect(data).toHaveProperty('accessToken');
      expect(data).toHaveProperty('refreshToken');
      expect(data).toHaveProperty('user');
      expect(data.user.email).toBe(body.email);
      expect(data.user.userName).toBe(body.userName);
    });

    it('should return 409 when email is already taken', async () => {
      const body = createRegisterBody();
      await request(app.getHttpServer() as Parameters<typeof request>[0])
        .post(`${AUTH_BASE}/register`)
        .send(body)
        .expect(HTTP_STATUS.CREATED);
      const res = await request(
        app.getHttpServer() as Parameters<typeof request>[0],
      )
        .post(`${AUTH_BASE}/register`)
        .send(body)
        .expect(HTTP_STATUS.CONFLICT);
      expect((res.body as ApiErrorResponse).message).toContain('Email');
    });
  });

  describe('POST /auth/login', () => {
    it('should return 200 and tokens for valid credentials', async () => {
      const res = await request(
        app.getHttpServer() as Parameters<typeof request>[0],
      )
        .post(`${AUTH_BASE}/login`)
        .send(sharedCredentials)
        .expect(HTTP_STATUS.OK);
      const data = (res.body as AuthLoginResponse).data;
      expect(data).toHaveProperty('accessToken');
      expect(data).toHaveProperty('user');
      sharedAccessToken = data.accessToken;
    });

    it('should return 404 when user not found', async () => {
      await request(app.getHttpServer() as Parameters<typeof request>[0])
        .post(`${AUTH_BASE}/login`)
        .send({ email: 'nonexistent@test.com', password: 'any' })
        .expect(HTTP_STATUS.NOT_FOUND);
    });
  });

  describe('GET /auth/profile', () => {
    it('should return 200 and user when token is valid', async () => {
      const res = await request(
        app.getHttpServer() as Parameters<typeof request>[0],
      )
        .get(`${AUTH_BASE}/profile`)
        .set('Authorization', `Bearer ${sharedAccessToken}`)
        .expect(HTTP_STATUS.OK);
      const data = (res.body as AuthProfileResponse).data;
      expect(data).toHaveProperty('email');
      expect(data).toHaveProperty('userName');
    });

    it('should return 401 when no token provided', async () => {
      await request(app.getHttpServer() as Parameters<typeof request>[0])
        .get(`${AUTH_BASE}/profile`)
        .expect(HTTP_STATUS.UNAUTHORIZED);
    });
  });
});
