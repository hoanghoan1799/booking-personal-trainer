/**
 * E2E test app bootstrap.
 * Requires: Postgres, and Redis (BullMQ connects using env; see README e2e section).
 */
import { Test, TestingModule } from '@nestjs/testing';
import {
  type ExecutionContext,
  type INestApplication,
  VersioningType,
} from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { getQueueToken } from '@nestjs/bullmq';
import { CacheModule } from '@nestjs/cache-manager';
import { MikroORM } from '@mikro-orm/core';
import type { Queue } from 'bullmq';
import helmet from 'helmet';

import { AppModule } from '../../app.module';
import { API_PREFIX } from '../../common/constants/app.constant';
import {
  REDIS_CLIENT_TOKEN,
  REDIS_PUBLISHER_TOKEN,
  REDIS_SUBSCRIBER_TOKEN,
} from '../../common/constants/cache.constant';
import { GLOBAL_PIPE_CONFIG } from '../../configs/pipe.config';
import { CORS_CONFIG } from '../../configs/cors.config';
import { HELMET_CONFIG } from '../../configs/helmet.config';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { User } from '../../modules/user/entities/user.entity';
import { EMAIL_QUEUE_NAME } from '../../modules/email/constants/email-queue.constant';
import { EmailProcessor } from '../../modules/email/workers/email.processor';
import { EmailSenderToken } from '../../modules/email/types/email.types';
import {
  e2eMockEmailQueue,
  e2eMockEmailSender,
  e2eMockRedisClient,
  e2eMockEmailProcessorStub,
} from './mock-providers';
import { cleanDatabase, runMigrations } from './test-database';

export type CreateTestAppOptions = {
  /** When true, {@link setTestUser} is honored via a JwtAuthGuard spy (default). */
  readonly applyJwtTestUserSpy?: boolean;
  /** When true, the global rate-limit guard is bypassed (default for API e2e). */
  readonly bypassGlobalRateLimit?: boolean;
  /** When true, use in-memory cache instead of redis-backed CacheModule. */
  readonly useInMemoryCache?: boolean;
  /** When true, mock Redis service clients, email queue, and sender (default for API e2e). */
  readonly mockInfraAdapters?: boolean;
};

let currentTestUser: User | null = null;

/**
 * Sets the user injected by the JwtAuthGuard test spy. Pass null to use the real guard.
 */
export const setTestUser = (user: User | null): void => {
  currentTestUser = user;
};

export const getTestUser = (): User | null => {
  return currentTestUser;
};

const noopCanActivate = {
  canActivate: (): boolean => true,
};

const applyCommonAppConfig = (app: INestApplication): void => {
  app.setGlobalPrefix(API_PREFIX);
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });
  app.useGlobalPipes(GLOBAL_PIPE_CONFIG);
};

const installJwtTestUserSpy = (): void => {
  // eslint-disable-next-line @typescript-eslint/unbound-method -- save reference to restore Passport behavior
  const original = JwtAuthGuard.prototype.canActivate;
  jest
    .spyOn(JwtAuthGuard.prototype, 'canActivate')
    .mockImplementation(function mockCanActivate(
      this: JwtAuthGuard,
      context: ExecutionContext,
    ): boolean | Promise<boolean> {
      if (currentTestUser) {
        const req = context.switchToHttp().getRequest<{ user: User }>();
        req.user = currentTestUser;
        return true;
      }
      return original.call(this, context) as boolean | Promise<boolean>;
    });
};

const buildTestModule = (
  options: CreateTestAppOptions,
): ReturnType<typeof Test.createTestingModule> => {
  const bypassGlobalRateLimit: boolean = options.bypassGlobalRateLimit ?? true;
  const useInMemoryCache: boolean = options.useInMemoryCache ?? true;
  const mockInfraAdapters: boolean = options.mockInfraAdapters ?? true;
  let moduleBuilder = Test.createTestingModule({
    imports: [AppModule],
  });
  if (useInMemoryCache) {
    moduleBuilder = moduleBuilder.overrideModule(CacheModule).useModule(
      CacheModule.register({
        isGlobal: true,
      }),
    );
  }
  if (bypassGlobalRateLimit) {
    moduleBuilder = moduleBuilder
      .overrideProvider(APP_GUARD)
      .useValue(noopCanActivate);
  }
  if (mockInfraAdapters) {
    const emailQueueToken = getQueueToken(EMAIL_QUEUE_NAME);
    moduleBuilder = moduleBuilder
      .overrideProvider(REDIS_CLIENT_TOKEN)
      .useValue(e2eMockRedisClient)
      .overrideProvider(REDIS_PUBLISHER_TOKEN)
      .useValue(e2eMockRedisClient)
      .overrideProvider(REDIS_SUBSCRIBER_TOKEN)
      .useValue(e2eMockRedisClient)
      .overrideProvider(emailQueueToken)
      .useValue(e2eMockEmailQueue)
      .overrideProvider(EmailSenderToken)
      .useValue(e2eMockEmailSender)
      .overrideProvider(EmailProcessor)
      .useValue(e2eMockEmailProcessorStub);
  }
  return moduleBuilder;
};

/**
 * Default e2e app: in-memory cache, mocked Redis service clients, mocked email queue, no global rate limit, Jwt test-user spy.
 */
export const createTestApp = async (
  options: CreateTestAppOptions = {},
): Promise<{
  app: INestApplication;
  module: TestingModule;
  orm: MikroORM;
}> => {
  const applyJwtTestUserSpy: boolean = options.applyJwtTestUserSpy ?? true;
  const moduleFixture: TestingModule = await buildTestModule(options).compile();
  const orm: MikroORM = moduleFixture.get(MikroORM);
  await runMigrations(orm);
  const app: INestApplication = moduleFixture.createNestApplication();
  applyCommonAppConfig(app);
  await app.init();
  if (applyJwtTestUserSpy) {
    installJwtTestUserSpy();
  }
  return { app, module: moduleFixture, orm };
};

/**
 * Auth flows: real JwtAuthGuard, mocked Redis (refresh tokens) and email; rate limit bypassed.
 */
export const createAuthE2eTestApp = async (): Promise<{
  app: INestApplication;
  module: TestingModule;
  orm: MikroORM;
}> => {
  return createTestApp({
    applyJwtTestUserSpy: false,
    bypassGlobalRateLimit: true,
    useInMemoryCache: true,
    mockInfraAdapters: true,
  });
};

/**
 * Infrastructure: Helmet + CORS, real global rate limiter, no Jwt spy, no infra mocks.
 */
export const createInfrastructureTestApp = async (): Promise<{
  app: INestApplication;
  module: TestingModule;
  orm: MikroORM;
}> => {
  const moduleFixture: TestingModule = await buildTestModule({
    applyJwtTestUserSpy: false,
    bypassGlobalRateLimit: false,
    useInMemoryCache: true,
    mockInfraAdapters: false,
  }).compile();
  const orm: MikroORM = moduleFixture.get(MikroORM);
  await runMigrations(orm);
  const app: INestApplication = moduleFixture.createNestApplication();
  app.use(helmet(HELMET_CONFIG as Parameters<typeof helmet>[0]));
  app.enableCors(CORS_CONFIG);
  applyCommonAppConfig(app);
  await app.init();
  return { app, module: moduleFixture, orm };
};

export const teardownTestApp = async (args: {
  app: INestApplication | undefined;
  orm: MikroORM | undefined;
}): Promise<void> => {
  await cleanDatabase(args.orm);
  if (args.app != null) {
    try {
      const emailQueue: Queue = args.app.get<Queue>(
        getQueueToken(EMAIL_QUEUE_NAME),
      );
      await emailQueue.close();
    } catch {
      /* email queue not registered in partial module graphs */
    }
    await args.app.close();
  }
  if (args.orm != null) {
    const connected: boolean = await args.orm.isConnected();
    if (connected) {
      await args.orm.close();
    }
  }
};

export { cleanDatabase, runMigrations } from './test-database';
