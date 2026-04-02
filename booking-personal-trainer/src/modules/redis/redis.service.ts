import {
  Inject,
  Injectable,
  Logger,
  OnApplicationShutdown,
  OnModuleInit,
} from '@nestjs/common';
import type { RedisClientType } from 'redis';

//  Commons
import { REDIS_CLIENT_TOKEN } from '../../common/constants/cache.constant';

// DTOs
import { KeyDto, SetKeyDto } from './dtos/key.dto';
import type { RedisHealthResponse } from './types/redis-health-response.type';

const REDIS_HEALTH_KEY_PREFIX = 'healthcheck' as const;
const REDIS_HEALTH_KEY_TTL_SECONDS = 10 as const;
const MILLISECONDS_PER_SECOND = 1000 as const;

@Injectable()
export class RedisService implements OnModuleInit, OnApplicationShutdown {
  private readonly logger: Logger = new Logger(RedisService.name);
  constructor(
    @Inject(REDIS_CLIENT_TOKEN)
    private readonly client: RedisClientType,
  ) {}

  public async onModuleInit(): Promise<void> {
    const health: RedisHealthResponse = await this.checkHealth();
    if (health.isReady && health.isSetGetOk) {
      this.logger.log(
        `Redis health OK (ping=${health.pingLatencyMilliseconds}ms, open=${health.isOpen}, ready=${health.isReady})`,
      );
      return;
    }
    this.logger.error(
      `Redis health FAILED (open=${health.isOpen}, ready=${health.isReady}, setGetOk=${health.isSetGetOk}, error=${health.errorMessage ?? 'unknown'})`,
    );
  }

  public async onApplicationShutdown(): Promise<void> {
    if (!this.client.isOpen) {
      return;
    }
    try {
      await this.client.quit();
    } catch (err: unknown) {
      const errorMessage: string =
        err instanceof Error
          ? err.message
          : 'Unknown error while quitting Redis client';
      this.logger.warn(
        `Failed to quit Redis client gracefully: ${errorMessage}`,
      );
    }
  }

  /**
   * Sets a key-value pair in Redis.
   * If ttlSeconds is provided, the key will expire after the specified number of seconds.
   * @param args The arguments to set the key-value pair.
   * @returns A promise that resolves when the key-value pair has been set.
   */
  public async setKey(args: SetKeyDto): Promise<void> {
    const { key, value, ttlSeconds } = args;
    if (ttlSeconds) {
      await this.client.set(key, value, {
        EX: ttlSeconds,
      });
      return;
    }
    await this.client.set(key, value);
  }

  /**
   * Retrieves a value from Redis by key.
   * If the key does not exist in Redis, null is returned.
   * @param args The arguments to retrieve the value from Redis.
   * @returns A promise that resolves with the value from Redis, or null if the key does not exist.
   */
  public async getKey(args: KeyDto): Promise<string | null> {
    const { key } = args;
    const value: string | null = await this.client.get(key);
    return value;
  }

  /**
   * Deletes a key from Redis.
   * @param args The arguments to delete the key from Redis.
   * @returns A promise that resolves when the key has been deleted from Redis.
   */
  public async deleteKey(args: KeyDto): Promise<void> {
    const { key } = args;
    await this.client.del(key);
  }

  /**
   * Performs a Redis health check:
   * - Confirms client state (`isOpen`, `isReady`)
   * - Executes a `PING` to measure latency
   * - Executes a `SET`/`GET` round-trip to validate read/write
   */
  public async checkHealth(): Promise<RedisHealthResponse> {
    const timestamp: string = new Date().toISOString();
    const isOpen: boolean = this.client.isOpen;
    const isReady: boolean = this.client.isReady;
    if (!isOpen) {
      return {
        timestamp,
        isOpen,
        isReady,
        pingLatencyMilliseconds: null,
        isSetGetOk: false,
        errorMessage: 'Redis client is not open',
      };
    }
    try {
      const pingLatencyMilliseconds: number =
        await this.measurePingLatencyMilliseconds();
      const isSetGetOk: boolean = await this.executeSetGetProbe();
      return {
        timestamp,
        isOpen,
        isReady: this.client.isReady,
        pingLatencyMilliseconds,
        isSetGetOk,
        errorMessage: null,
      };
    } catch (err: unknown) {
      const errorMessage: string =
        err instanceof Error ? err.message : 'Unknown Redis health-check error';
      return {
        timestamp,
        isOpen: this.client.isOpen,
        isReady: this.client.isReady,
        pingLatencyMilliseconds: null,
        isSetGetOk: false,
        errorMessage,
      };
    }
  }

  private async measurePingLatencyMilliseconds(): Promise<number> {
    const startTimeMilliseconds: number = Date.now();
    await this.client.ping();
    const elapsedMilliseconds: number = Date.now() - startTimeMilliseconds;
    return elapsedMilliseconds;
  }

  private async executeSetGetProbe(): Promise<boolean> {
    const probeKey: string = `${REDIS_HEALTH_KEY_PREFIX}:${process.pid}:${Date.now()}`;
    const expectedValue: string = `ok:${Math.floor(Date.now() / MILLISECONDS_PER_SECOND)}`;
    await this.client.set(probeKey, expectedValue, {
      EX: REDIS_HEALTH_KEY_TTL_SECONDS,
    });
    const actualValue: string | null = await this.client.get(probeKey);
    await this.client.del(probeKey);
    return actualValue === expectedValue;
  }
}
