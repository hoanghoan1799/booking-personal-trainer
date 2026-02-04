import { Inject, Injectable } from '@nestjs/common';
import type { RedisClientType } from 'redis';

//  Commons
import { REDIS_CLIENT_TOKEN } from '../../common/constants/cache.constant';

// DTOs
import { KeyDto, SetKeyDto } from './dtos/key.dto';

@Injectable()
export class RedisService {
  constructor(
    @Inject(REDIS_CLIENT_TOKEN)
    private readonly client: RedisClientType,
  ) {}

  /**
   * Sets a key-value pair in Redis.
   * If ttlSeconds is provided, the key will expire after the specified number of seconds.
   * @param args The arguments to set the key-value pair.
   * @returns A promise that resolves when the key-value pair has been set.
   */
  async setKey(args: SetKeyDto): Promise<void> {
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
  async getKey(args: KeyDto): Promise<string | null> {
    const { key } = args;
    const value: string | null = await this.client.get(key);
    return value;
  }

  /**
   * Deletes a key from Redis.
   * @param args The arguments to delete the key from Redis.
   * @returns A promise that resolves when the key has been deleted from Redis.
   */
  async deleteKey(args: KeyDto): Promise<void> {
    const { key } = args;
    await this.client.del(key);
  }
}
