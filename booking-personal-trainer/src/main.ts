import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MikroORM } from '@mikro-orm/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import cookieParser from 'cookie-parser';

// Commons
import { API_PREFIX, APP_PORT_DEFAULT } from './common/constants/app.constant';
import { AllExceptionsFilter } from './common/filters/all-exception.filter';

// Configs
import { CORS_CONFIG } from './configs/cors.config';

async function bootstrap() {
  // Create app
  const app = await NestFactory.create(AppModule);

  // Run migrations
  const orm = app.get(MikroORM);
  await orm.migrator.up();

  // Enable cookies
  app.use(cookieParser());

  // Enable cors
  app.enableCors(CORS_CONFIG);

  // Global prefix for all routes
  app.setGlobalPrefix(API_PREFIX);

  // Enable versioning for all routes
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global filters
  app.useGlobalFilters(new AllExceptionsFilter());

  // Start server
  await app.listen(process.env.PORT ?? APP_PORT_DEFAULT);

  // Shutdown
  app.enableShutdownHooks();
}

void bootstrap();
