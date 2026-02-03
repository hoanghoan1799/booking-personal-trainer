import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MikroORM } from '@mikro-orm/core';
import { ValidationPipe } from '@nestjs/common';

// Commons
import { APP_PORT_DEFAULT } from './common/constants/app.constant';
import { AllExceptionsFilter } from './common/filters/all-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  // Create app
  const app = await NestFactory.create(AppModule);

  // Run migrations
  const orm = app.get(MikroORM);
  await orm.migrator.up();

  // Global interceptors
  app.useGlobalInterceptors(new TransformInterceptor());

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
