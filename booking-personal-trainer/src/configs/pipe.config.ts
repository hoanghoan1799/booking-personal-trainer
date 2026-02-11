import { ValidationPipe } from '@nestjs/common';

export const GLOBAL_PIPE_CONFIG = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
  transformOptions: {
    enableImplicitConversion: true,
  },
});
