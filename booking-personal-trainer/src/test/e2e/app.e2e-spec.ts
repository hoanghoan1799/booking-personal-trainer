import { INestApplication } from '@nestjs/common';
import { MikroORM } from '@mikro-orm/core';

import { createTestApp, teardownTestApp } from '../setup/test-app.factory';
import { resetE2EProviderMocks } from '../setup/mock-providers';

describe('App (e2e)', () => {
  let app!: INestApplication;
  let orm!: MikroORM;

  beforeAll(async () => {
    const test = await createTestApp();
    app = test.app;
    orm = test.orm;
  });

  afterAll(async () => {
    await teardownTestApp({ app, orm });
  });

  beforeEach(() => {
    resetE2EProviderMocks();
  });

  it('should be defined', () => {
    expect(app).toBeDefined();
  });
});
