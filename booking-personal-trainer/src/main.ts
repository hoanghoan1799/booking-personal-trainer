import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

// Commons
import { APP_PORT_DEFAULT } from './common/constants/app.constant';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? APP_PORT_DEFAULT);
}
void bootstrap();
