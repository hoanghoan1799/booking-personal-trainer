import { Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from 'redis';

// Constants
import {
  DEFAULT_HOST,
  DEFAULT_REDIS_PORT,
} from '../../common/constants/app.constant';
import {
  DEFAULT_REDIS_CONNECT_TIMEOUT_MILLISECONDS,
  REDIS_CLIENT_TOKEN,
  REDIS_RECONNECT_DELAY_INCREMENT_MILLISECONDS,
  REDIS_RECONNECT_DELAY_MAX_MILLISECONDS,
} from '../../common/constants/cache.constant';

// Helpers
import { executeWithTimeout } from './helpers/redis.helper';

// Services
import { RedisController } from './redis.controller';
import { RedisService } from './redis.service';

@Module({
  controllers: [RedisController],
  providers: [
    {
      provide: REDIS_CLIENT_TOKEN,
      useFactory: async (configService: ConfigService) => {
        const logger: Logger = new Logger(REDIS_CLIENT_TOKEN);
        const host: string = configService.get<string>(
          'REDIS_HOST',
          DEFAULT_HOST,
        );
        const port: number = configService.get<number>(
          'REDIS_PORT',
          DEFAULT_REDIS_PORT,
        );
        const password: string | undefined =
          configService.get<string>('REDIS_PASSWORD');
        const connectTimeoutMilliseconds: number = configService.get<number>(
          'REDIS_CONNECT_TIMEOUT_MS',
          DEFAULT_REDIS_CONNECT_TIMEOUT_MILLISECONDS,
        );
        const client = createClient({
          socket: {
            host,
            port,
            reconnectStrategy: (retries: number): number => {
              const delayMilliseconds: number = Math.min(
                retries * REDIS_RECONNECT_DELAY_INCREMENT_MILLISECONDS,
                REDIS_RECONNECT_DELAY_MAX_MILLISECONDS,
              );
              return delayMilliseconds;
            },
          },
          password,
        });

        client.on('connect', () => {
          logger.log(`Redis socket connected (${host}:${port})`);
        });
        client.on('ready', () => {
          logger.log(`Redis client ready (${host}:${port})`);
        });
        client.on('reconnecting', () => {
          logger.warn(`Redis reconnecting (${host}:${port})`);
        });
        client.on('end', () => {
          logger.warn(`Redis connection closed (${host}:${port})`);
        });
        client.on('error', (err: unknown) => {
          const errorMessage: string =
            err instanceof Error ? err.message : 'Unknown Redis error';
          logger.error(`Redis error: ${errorMessage}`);
        });

        try {
          await executeWithTimeout({
            task: client.connect(),
            timeoutMilliseconds: connectTimeoutMilliseconds,
            timeoutMessage: `Redis connect timeout after ${connectTimeoutMilliseconds}ms (${host}:${port})`,
          });
          logger.log(`Redis connected successfully (${host}:${port})`);
        } catch (err: unknown) {
          const errorMessage: string =
            err instanceof Error ? err.message : 'Unknown Redis connect error';
          logger.error(`Redis connect failed: ${errorMessage}`);
          throw err;
        }
        return client;
      },
      inject: [ConfigService],
    },
    RedisService,
  ],
  exports: [RedisService],
})
export class RedisModule {}
