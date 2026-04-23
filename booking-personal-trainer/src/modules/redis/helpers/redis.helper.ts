import { WithTimeoutArgs } from '../types/redis-health-response.type';

export const executeWithTimeout = async <T>(
  args: WithTimeoutArgs<T>,
): Promise<T> => {
  const { task, timeoutMilliseconds, timeoutMessage } = args;
  let timeoutId: NodeJS.Timeout;
  const timeoutTask: Promise<never> = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(timeoutMessage));
    }, timeoutMilliseconds);
  });
  const taskWithCleanup: Promise<T> = task.finally(() => {
    clearTimeout(timeoutId);
  });
  const result: T = await Promise.race([taskWithCleanup, timeoutTask]);

  return result;
};
