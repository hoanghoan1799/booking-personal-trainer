export const RedisConstants = {
  Health: {
    KeyPrefix: 'healthcheck',
    KeyTtlSeconds: 10,
  },
  Time: {
    MillisecondsPerSecond: 1000,
  },
} as const;
