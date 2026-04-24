import { Provider } from '@nestjs/common';
import { getQueueToken } from '@nestjs/bullmq';
import type { RedisClientType } from 'redis';

import {
  REDIS_CLIENT_TOKEN,
  REDIS_PUBLISHER_TOKEN,
  REDIS_SUBSCRIBER_TOKEN,
} from '../../common/constants/cache.constant';
import { EMAIL_QUEUE_NAME } from '../../modules/email/constants/email-queue.constant';
import { EmailSenderToken } from '../../modules/email/types/email.types';
import { EmailProcessor } from '../../modules/email/workers/email.processor';

/**
 * In-memory string store for mocked Redis clients (used by e2e).
 */
const mockKeyValueStore = new Map<string, string>();

const normalizeRedisKeyPartToString = (value: unknown): string => {
  if (typeof value === 'string') {
    return value;
  }
  if (Buffer.isBuffer(value)) {
    return value.toString('utf8');
  }
  return String(value);
};

const createMockRedisClient = (): Pick<
  RedisClientType,
  | 'get'
  | 'set'
  | 'del'
  | 'ping'
  | 'isOpen'
  | 'isReady'
  | 'connect'
  | 'on'
  | 'quit'
  | 'publish'
  | 'subscribe'
  | 'unsubscribe'
> => {
  const client: Pick<
    RedisClientType,
    | 'get'
    | 'set'
    | 'del'
    | 'ping'
    | 'isOpen'
    | 'isReady'
    | 'connect'
    | 'on'
    | 'quit'
    | 'publish'
    | 'subscribe'
    | 'unsubscribe'
  > = {
    isOpen: true,
    isReady: true,
    get: (key) => {
      const normalizedKey: string = normalizeRedisKeyPartToString(key);
      return Promise.resolve(mockKeyValueStore.get(normalizedKey) ?? null);
    },
    set: (key, value) => {
      const normalizedKey: string = normalizeRedisKeyPartToString(key);
      const normalizedValue: string = normalizeRedisKeyPartToString(value);
      mockKeyValueStore.set(normalizedKey, normalizedValue);
      return Promise.resolve('OK');
    },
    del: (keys) => {
      const arr: unknown[] = Array.isArray(keys) ? keys : [keys];
      let n = 0;
      for (const rawKey of arr) {
        const normalizedKey: string = normalizeRedisKeyPartToString(rawKey);
        if (mockKeyValueStore.delete(normalizedKey)) {
          n += 1;
        }
      }
      return Promise.resolve(n);
    },
    ping: () => Promise.resolve('PONG'),
    connect: () => Promise.resolve(client as unknown as RedisClientType),
    on: () => client as unknown as RedisClientType,
    quit: () => Promise.resolve('OK'),
    publish: () => Promise.resolve(0),
    subscribe: () => Promise.resolve(),
    unsubscribe: () => Promise.resolve(),
  };
  return client;
};

export const resetMockRedisData = (): void => {
  mockKeyValueStore.clear();
};

/** Single shared in-memory client for all Redis service tokens. */
export const e2eMockRedisClient = createMockRedisClient();

export const e2eMockEmailQueue = {
  add: jest.fn().mockResolvedValue({ id: 'e2e-job-1' }),
  close: jest.fn().mockResolvedValue(undefined),
  on: jest.fn(),
  off: jest.fn(),
};

export const e2eMockEmailSender = {
  send: jest.fn().mockResolvedValue({ messageId: 'e2e-mock-message-id' }),
};

export const e2eMockEmailProcessorStub = {
  process: jest.fn().mockResolvedValue(undefined),
};

export const MockRedisClientProvider: Provider = {
  provide: REDIS_CLIENT_TOKEN,
  useValue: e2eMockRedisClient,
};

export const MockRedisPublisherProvider: Provider = {
  provide: REDIS_PUBLISHER_TOKEN,
  useValue: e2eMockRedisClient,
};

export const MockRedisSubscriberProvider: Provider = {
  provide: REDIS_SUBSCRIBER_TOKEN,
  useValue: e2eMockRedisClient,
};

export const MockEmailQueueProvider: Provider = {
  provide: getQueueToken(EMAIL_QUEUE_NAME),
  useValue: e2eMockEmailQueue,
};

export const MockEmailSenderProvider: Provider = {
  provide: EmailSenderToken,
  useValue: e2eMockEmailSender,
};

export const EmailProcessorE2EStubProvider: Provider = {
  provide: EmailProcessor,
  useValue: e2eMockEmailProcessorStub,
};

/**
 * Resets all jest mocks used by the e2e module overrides.
 * Call in beforeEach; also clears the in-memory Redis map for isolation.
 */
export const resetE2EProviderMocks = (): void => {
  jest.clearAllMocks();
  resetMockRedisData();
};
