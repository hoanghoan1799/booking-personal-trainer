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
  REDIS_PUBLISHER_TOKEN,
  REDIS_SUBSCRIBER_TOKEN,
  REDIS_RECONNECT_DELAY_INCREMENT_MILLISECONDS,
  REDIS_RECONNECT_DELAY_MAX_MILLISECONDS,
} from '../../common/constants/cache.constant';

// Helpers
import { executeWithTimeout } from './helpers/redis.helper';

// Services
import { RedisController } from './redis.controller';
import { RedisService } from './redis.service';

type RedisClientArgs = {
  readonly host: string;
  readonly port: number;
  readonly password?: string;
};

const createRedisClient = (args: RedisClientArgs) => {
  return createClient({
    socket: {
      host: args.host,
      port: args.port,
      reconnectStrategy: (retries: number): number => {
        const delayMilliseconds: number = Math.min(
          retries * REDIS_RECONNECT_DELAY_INCREMENT_MILLISECONDS,
          REDIS_RECONNECT_DELAY_MAX_MILLISECONDS,
        );
        return delayMilliseconds;
      },
    },
    password: args.password,
  });
};

const connectRedisClient = async (args: {
  readonly clientName: string;
  readonly client: ReturnType<typeof createClient>;
  readonly logger: Logger;
  readonly host: string;
  readonly port: number;
  readonly connectTimeoutMilliseconds: number;
}): Promise<ReturnType<typeof createClient>> => {
  const { clientName, client, logger, host, port, connectTimeoutMilliseconds } =
    args;
  client.on('connect', () => {
    logger.log(`${clientName} socket connected (${host}:${port})`);
  });
  client.on('ready', () => {
    logger.log(`${clientName} client ready (${host}:${port})`);
  });
  client.on('reconnecting', () => {
    logger.warn(`${clientName} reconnecting (${host}:${port})`);
  });
  client.on('end', () => {
    logger.warn(`${clientName} connection closed (${host}:${port})`);
  });
  client.on('error', (err: unknown) => {
    const errorMessage: string =
      err instanceof Error ? err.message : 'Unknown Redis error';
    logger.error(`${clientName} error: ${errorMessage}`);
  });
  await executeWithTimeout({
    task: client.connect(),
    timeoutMilliseconds: connectTimeoutMilliseconds,
    timeoutMessage: `Redis connect timeout after ${connectTimeoutMilliseconds}ms (${clientName}, ${host}:${port})`,
  });
  logger.log(`${clientName} connected successfully (${host}:${port})`);
  return client;
};

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
        try {
          const client = createRedisClient({ host, port, password });
          return await connectRedisClient({
            clientName: REDIS_CLIENT_TOKEN,
            client,
            logger,
            host,
            port,
            connectTimeoutMilliseconds,
          });
        } catch (err: unknown) {
          const errorMessage: string =
            err instanceof Error ? err.message : 'Unknown Redis connect error';
          logger.error(`Redis connect failed: ${errorMessage}`);
          throw err;
        }
      },
      inject: [ConfigService],
    },
    {
      provide: REDIS_PUBLISHER_TOKEN,
      useFactory: async (configService: ConfigService) => {
        const logger: Logger = new Logger(REDIS_PUBLISHER_TOKEN);
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
        const client = createRedisClient({ host, port, password });
        return await connectRedisClient({
          clientName: REDIS_PUBLISHER_TOKEN,
          client,
          logger,
          host,
          port,
          connectTimeoutMilliseconds,
        });
      },
      inject: [ConfigService],
    },
    {
      provide: REDIS_SUBSCRIBER_TOKEN,
      useFactory: async (configService: ConfigService) => {
        const logger: Logger = new Logger(REDIS_SUBSCRIBER_TOKEN);
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
        const client = createRedisClient({ host, port, password });
        return await connectRedisClient({
          clientName: REDIS_SUBSCRIBER_TOKEN,
          client,
          logger,
          host,
          port,
          connectTimeoutMilliseconds,
        });
      },
      inject: [ConfigService],
    },
    RedisService,
  ],
  exports: [RedisService, REDIS_PUBLISHER_TOKEN, REDIS_SUBSCRIBER_TOKEN],
})
export class RedisModule {}
