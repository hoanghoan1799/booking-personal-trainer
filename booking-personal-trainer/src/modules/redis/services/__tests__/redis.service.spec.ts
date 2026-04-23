import { RedisService } from '../redis.service';

type RedisClientMock = {
  isOpen: boolean;
  isReady: boolean;
  set: jest.Mock;
  get: jest.Mock;
  del: jest.Mock;
  ping: jest.Mock;
  quit: jest.Mock;
};

describe('RedisService', () => {
  const createClient = (
    overrides?: Partial<RedisClientMock>,
  ): RedisClientMock => ({
    isOpen: true,
    isReady: true,
    set: jest.fn().mockResolvedValue('OK'),
    get: jest.fn().mockResolvedValue(null),
    del: jest.fn().mockResolvedValue(1),
    ping: jest.fn().mockResolvedValue('PONG'),
    quit: jest.fn().mockResolvedValue('OK'),
    ...overrides,
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('setKey', () => {
    it('should set with ttl when ttlSeconds provided', async () => {
      const client = createClient();
      const service = new RedisService(client as never);

      await service.setKey({ key: 'k', value: 'v', ttlSeconds: 5 });

      expect(client.set).toHaveBeenCalledWith('k', 'v', { EX: 5 });
    });

    it('should set without ttl when ttlSeconds missing', async () => {
      const client = createClient();
      const service = new RedisService(client as never);

      await service.setKey({ key: 'k', value: 'v' });

      expect(client.set).toHaveBeenCalledWith('k', 'v');
    });
  });

  describe('getKey', () => {
    it('should return value from client', async () => {
      const client = createClient({ get: jest.fn().mockResolvedValue('v') });
      const service = new RedisService(client as never);

      const actual = await service.getKey({ key: 'k' });

      expect(actual).toBe('v');
      expect(client.get).toHaveBeenCalledWith('k');
    });
  });

  describe('deleteKey', () => {
    it('should delete key', async () => {
      const client = createClient();
      const service = new RedisService(client as never);

      await service.deleteKey({ key: 'k' });

      expect(client.del).toHaveBeenCalledWith('k');
    });
  });

  describe('checkHealth', () => {
    it('should return failure when client not open', async () => {
      const client = createClient({ isOpen: false, isReady: false });
      const service = new RedisService(client as never);

      const actual = await service.checkHealth();

      expect(actual.isOpen).toBe(false);
      expect(actual.isSetGetOk).toBe(false);
      expect(actual.errorMessage).toBe('Redis client is not open');
    });

    it('should return ok when ping and set/get succeed', async () => {
      const nowSpy = jest
        .spyOn(Date, 'now')
        .mockReturnValueOnce(1000)
        .mockReturnValueOnce(1005)
        .mockReturnValueOnce(2000)
        .mockReturnValueOnce(2000)
        .mockReturnValueOnce(2000);
      const client = createClient({
        get: jest.fn().mockResolvedValue('ok:2'),
      });
      const service = new RedisService(client as never);

      const actual = await service.checkHealth();

      expect(actual.pingLatencyMilliseconds).toBe(5);
      expect(actual.isSetGetOk).toBe(true);
      expect(client.ping).toHaveBeenCalled();
      expect(client.set).toHaveBeenCalled();
      expect(client.get).toHaveBeenCalled();
      expect(client.del).toHaveBeenCalled();
      nowSpy.mockRestore();
    });

    it('should return isSetGetOk=false when probe value mismatches', async () => {
      jest.spyOn(Date, 'now').mockReturnValue(2000);
      const client = createClient({
        get: jest.fn().mockResolvedValue('wrong'),
      });
      const service = new RedisService(client as never);

      const actual = await service.checkHealth();

      expect(actual.isOpen).toBe(true);
      expect(actual.isSetGetOk).toBe(false);
      expect(actual.errorMessage).toBeNull();
    });

    it('should return errorMessage when ping throws', async () => {
      const client = createClient({
        ping: jest.fn().mockRejectedValue(new Error('ping failed')),
      });
      const service = new RedisService(client as never);

      const actual = await service.checkHealth();

      expect(actual.isSetGetOk).toBe(false);
      expect(actual.errorMessage).toBe('ping failed');
    });
  });

  describe('onApplicationShutdown', () => {
    it('should return early when client not open', async () => {
      const client = createClient({ isOpen: false });
      const service = new RedisService(client as never);

      await service.onApplicationShutdown();

      expect(client.quit).not.toHaveBeenCalled();
    });

    it('should attempt quit when open', async () => {
      const client = createClient({ isOpen: true });
      const service = new RedisService(client as never);

      await service.onApplicationShutdown();

      expect(client.quit).toHaveBeenCalled();
    });

    it('should swallow quit errors', async () => {
      const client = createClient({
        isOpen: true,
        quit: jest.fn().mockRejectedValue('boom'),
      });
      const service = new RedisService(client as never);

      await service.onApplicationShutdown();

      expect(client.quit).toHaveBeenCalled();
    });
  });
});
