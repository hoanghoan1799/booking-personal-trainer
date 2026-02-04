import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from 'redis';

// Constants
import {
  DEFAULT_HOST,
  DEFAULT_REDIS_PORT,
} from 'src/common/constants/app.constant';
import { REDIS_CLIENT_TOKEN } from '../../common/constants/cache.constant';

// Services
import { RedisService } from './redis.service';

@Module({
  providers: [
    {
      provide: REDIS_CLIENT_TOKEN,
      useFactory: async (configService: ConfigService) => {
        const client = createClient({
          socket: {
            host: configService.get<string>('REDIS_HOST', DEFAULT_HOST),
            port: configService.get<number>('REDIS_PORT', DEFAULT_REDIS_PORT),
          },
          password: configService.get('REDIS_PASSWORD'),
        });

        await client.connect();
        return client;
      },
      inject: [ConfigService],
    },
    RedisService,
  ],
  exports: [RedisService],
})
export class RedisModule {}
