import { Injectable } from '@nestjs/common';

// Constants
import { TOKEN_MAX_AGE } from '../../../common/constants/token.constants';

// Services
import { RedisService } from '../../redis/redis.service';
import { HashingService } from './hashing.service';
import { RefreshTokenDto, RevokeTokenDto } from '../dtos/token.dto';

const REFRESH_TOKEN_KEY_PREFIX = 'refresh_token:';

/**
 * Service responsible for managing refresh tokens in Redis.
 */
@Injectable()
export class RefreshTokenService {
  private readonly redisService: RedisService;
  private readonly hashingService: HashingService;
  private readonly ttlSeconds: number;

  /**
   * Initializes a new instance of the RefreshTokenService.
   * @param {RedisService} redisService - The Redis service used to interact with Redis.
   * @param {HashingService} hashingService - The hashing service used to hash refresh tokens.
   */
  constructor(redisService: RedisService, hashingService: HashingService) {
    this.redisService = redisService;
    this.hashingService = hashingService;
    this.ttlSeconds = TOKEN_MAX_AGE.REFRESH / 1000;
  }

  /**
   * Saves a refresh token for a user in Redis.
   * The token is hashed using the HashingService before being saved.
   * The key is built using the buildKey method and the userId.
   * @param args The arguments to save the refresh token.
   * @returns A promise that resolves when the refresh token has been saved.
   */
  async saveRefreshToken(args: RefreshTokenDto): Promise<void> {
    const { userId, refreshToken } = args;
    const hashedToken: string = await this.hashingService.hash(refreshToken);
    const key: string = this.buildKey(userId);
    await this.redisService.setKey({
      key,
      value: hashedToken,
      ttlSeconds: this.ttlSeconds,
    });
  }

  /**
   * Validates a refresh token by comparing it with the stored hash in Redis.
   * @param {RefreshTokenDto} args - The arguments to validate the refresh token.
   * @returns A promise that resolves to a boolean indicating whether the refresh token is valid.
   */
  async validateRefreshToken(args: RefreshTokenDto): Promise<boolean> {
    const { userId, refreshToken } = args;
    const key: string = this.buildKey(userId);
    const storedHash: string | null = await this.redisService.getKey({ key });

    if (!storedHash) {
      return false;
    }

    const isValid: boolean = await this.hashingService.compare(
      refreshToken,
      storedHash,
    );

    return isValid;
  }

  /**
   * Removes a refresh token from Redis.
   * @param {RevokeTokenDto} args - The arguments to remove the refresh token.
   * @returns A promise that resolves when the refresh token has been removed.
   */
  async removeRefreshToken(args: RevokeTokenDto): Promise<void> {
    const { userId } = args;
    const key: string = this.buildKey(userId);

    await this.redisService.deleteKey({ key });
  }

  /**
   * Builds a Redis key based on the provided user ID.
   * The key is built by concatenating the REFRESH_TOKEN_KEY_PREFIX with the user ID.
   * @param {string} userId - The user ID to build the key for.
   * @returns {string} The built Redis key.
   */
  private buildKey(userId: string): string {
    return `${REFRESH_TOKEN_KEY_PREFIX}${userId}`;
  }
}
