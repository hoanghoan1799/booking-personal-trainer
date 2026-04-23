import { executeWithTimeout } from '../redis.helper';

describe('executeWithTimeout', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should resolve when task resolves before timeout', async () => {
    const task = Promise.resolve('ok');
    const promise = executeWithTimeout({
      task,
      timeoutMilliseconds: 1000,
      timeoutMessage: 'timeout',
    });

    await expect(promise).resolves.toBe('ok');
  });

  it('should reject when timeout fires first', async () => {
    const task = new Promise<string>(() => undefined);
    const promise = executeWithTimeout({
      task,
      timeoutMilliseconds: 10,
      timeoutMessage: 'timeout',
    });

    jest.advanceTimersByTime(20);

    await expect(promise).rejects.toThrow('timeout');
  });
});
