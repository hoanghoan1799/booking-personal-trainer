import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { MikroORM } from '@mikro-orm/core';
import { ClassSerializerInterceptor, VersioningType } from '@nestjs/common';
import { SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';

// Commons
import { API_PREFIX, APP_PORT_DEFAULT } from './common/constants/app.constant';
import { AllExceptionsFilter } from './common/filters/all-exception.filter';
import { ROUTES } from './common/constants/route.constant';
import { SWAGGER_JSON_FILE_NAME } from './common/constants/api-document.constants';

// Configs
import { CORS_CONFIG } from './configs/cors.config';
import { HELMET_CONFIG } from './configs/helmet.config';
import { SWAGGER_CONFIG } from './configs/swagger.config';
import { GLOBAL_PIPE_CONFIG } from './configs/pipe.config';

async function bootstrap() {
  // Create app
  const app = await NestFactory.create(AppModule);

  // Run migrations
  const orm = app.get(MikroORM);
  await orm.migrator.up();

  // Enable Helmet for security headers
  app.use(helmet(HELMET_CONFIG));

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
  app.useGlobalPipes(GLOBAL_PIPE_CONFIG);

  // Global interceptors
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  // Global filters
  app.useGlobalFilters(new AllExceptionsFilter());

  const documentFactory = () =>
    SwaggerModule.createDocument(app, SWAGGER_CONFIG);

  SwaggerModule.setup(ROUTES.API_DOCS, app, documentFactory, {
    jsonDocumentUrl: SWAGGER_JSON_FILE_NAME,
  });

  // Start server
  await app.listen(process.env.PORT ?? APP_PORT_DEFAULT);

  // Shutdown
  app.enableShutdownHooks();
}

void bootstrap();
