export type RedisHealthResponse = {
  readonly timestamp: string;
  readonly isOpen: boolean;
  readonly isReady: boolean;
  readonly pingLatencyMilliseconds: number | null;
  readonly isSetGetOk: boolean;
  readonly errorMessage: string | null;
};

export type WithTimeoutArgs<T> = {
  readonly task: Promise<T>;
  readonly timeoutMilliseconds: number;
  readonly timeoutMessage: string;
};
