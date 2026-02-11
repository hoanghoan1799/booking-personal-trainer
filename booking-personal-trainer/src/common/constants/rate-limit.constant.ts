export const RATE_LIMIT = {
  ERROR: {
    NAME: 'Too Many Requests',
    MESSAGE: 'Too many requests. Please try again later.',
    CODE: 'RATE_LIMIT_EXCEEDED',
  },
  TRACKER_KIND: {
    USER: 'user',
    TOKEN: 'token',
    IP: 'ip',
  },
} as const;
