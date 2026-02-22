import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { VersioningType } from '@nestjs/common';

// Constants
import { API_PREFIX } from '../common/constants/app.constant';

// Configs
import { GLOBAL_PIPE_CONFIG } from '../configs/pipe.config';

// Modules
import { AppModule } from '../app.module';

/**
 * E2E smoke test: verifies the app module compiles and can be bootstrapped.
 * Requires test database and Redis to be available (e.g. via .env.test or docker).
 */
describe('App (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

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

  it('should be defined', () => {
    expect(app).toBeDefined();
  });
});
