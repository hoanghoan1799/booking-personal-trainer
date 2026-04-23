import { RefreshTokenService } from '../refresh-token.service';
import type { RedisService } from '../../../redis/services/redis.service';
import type { HashingService } from '../hashing.service';

describe('RefreshTokenService', () => {
  const createRedisServiceMock = (): {
    readonly redisService: RedisService;
    readonly setKeyMock: jest.Mock<
      Promise<void>,
      [
        {
          readonly key: string;
          readonly value: string;
          readonly ttlSeconds: number;
        },
      ]
    >;
    readonly getKeyMock: jest.Mock<
      Promise<string | null>,
      [{ readonly key: string }]
    >;
    readonly deleteKeyMock: jest.Mock<
      Promise<void>,
      [{ readonly key: string }]
    >;
  } => {
    const setKeyMock: jest.Mock<
      Promise<void>,
      [
        {
          readonly key: string;
          readonly value: string;
          readonly ttlSeconds: number;
        },
      ]
    > = jest.fn<
      Promise<void>,
      [
        {
          readonly key: string;
          readonly value: string;
          readonly ttlSeconds: number;
        },
      ]
    >();
    const getKeyMock: jest.Mock<
      Promise<string | null>,
      [{ readonly key: string }]
    > = jest.fn<Promise<string | null>, [{ readonly key: string }]>();
    const deleteKeyMock: jest.Mock<
      Promise<void>,
      [{ readonly key: string }]
    > = jest.fn<Promise<void>, [{ readonly key: string }]>();
    const redisService = {
      setKey: setKeyMock,
      getKey: getKeyMock,
      deleteKey: deleteKeyMock,
    } as unknown as RedisService;
    return { redisService, setKeyMock, getKeyMock, deleteKeyMock };
  };

  const createHashingServiceMock = (): {
    readonly hashingService: HashingService;
    readonly hashMock: jest.Mock;
    readonly compareMock: jest.Mock;
  } => {
    const hashMock = jest.fn();
    const compareMock = jest.fn();
    const hashingService = {
      hash: hashMock,
      compare: compareMock,
    } as unknown as HashingService;
    return { hashingService, hashMock, compareMock };
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('saveRefreshToken should hash and store with ttl', async () => {
    const { redisService, setKeyMock } = createRedisServiceMock();
    const { hashingService, hashMock } = createHashingServiceMock();
    hashMock.mockResolvedValue('hashed');
    const service = new RefreshTokenService(redisService, hashingService);

    await service.saveRefreshToken({ userId: 'u1', refreshToken: 'rt' });

    expect(hashMock).toHaveBeenCalledWith('rt');
    expect(setKeyMock).toHaveBeenCalledTimes(1);
    const setKeyArg = setKeyMock.mock.calls[0]?.[0] as unknown;
    if (!setKeyArg || typeof setKeyArg !== 'object') {
      throw new Error('Expected setKey to be called with an object');
    }
    const input = setKeyArg as {
      readonly key?: unknown;
      readonly value?: unknown;
      readonly ttlSeconds?: unknown;
    };
    expect(typeof input.key).toBe('string');
    expect((input.key as string).includes('u1')).toBe(true);
    expect(input.value).toBe('hashed');
    expect(typeof input.ttlSeconds).toBe('number');
  });

  it('validateRefreshToken should return false when missing stored hash', async () => {
    const { redisService, getKeyMock } = createRedisServiceMock();
    const { hashingService, compareMock } = createHashingServiceMock();
    getKeyMock.mockResolvedValue(null);
    const service = new RefreshTokenService(redisService, hashingService);

    const actual = await service.validateRefreshToken({
      userId: 'u1',
      refreshToken: 'rt',
    });

    expect(actual).toBe(false);
    expect(compareMock).not.toHaveBeenCalled();
  });

  it('validateRefreshToken should compare when stored hash exists', async () => {
    const { redisService, getKeyMock } = createRedisServiceMock();
    const { hashingService, compareMock } = createHashingServiceMock();
    getKeyMock.mockResolvedValue('hashed');
    compareMock.mockResolvedValue(true);
    const service = new RefreshTokenService(redisService, hashingService);

    const actual = await service.validateRefreshToken({
      userId: 'u1',
      refreshToken: 'rt',
    });

    expect(compareMock).toHaveBeenCalledWith('rt', 'hashed');
    expect(actual).toBe(true);
  });

  it('removeRefreshToken should delete key', async () => {
    const { redisService, deleteKeyMock } = createRedisServiceMock();
    const { hashingService } = createHashingServiceMock();
    const service = new RefreshTokenService(redisService, hashingService);

    await service.removeRefreshToken({ userId: 'u1' });

    expect(deleteKeyMock).toHaveBeenCalledTimes(1);
    const deleteKeyArg = deleteKeyMock.mock.calls[0]?.[0] as unknown;
    if (!deleteKeyArg || typeof deleteKeyArg !== 'object') {
      throw new Error('Expected deleteKey to be called with an object');
    }
    const input = deleteKeyArg as { readonly key?: unknown };
    expect(typeof input.key).toBe('string');
    expect((input.key as string).includes('u1')).toBe(true);
  });
});
