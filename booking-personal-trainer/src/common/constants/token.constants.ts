export const TOKEN = {
  ACCESS: 'access',
  REFRESH: 'refresh',
};

export const TOKEN_EXPIRATION = {
  ACCESS: '15m',
  REFRESH: '7d',
} as const;

export const TOKEN_MAX_AGE = {
  ACCESS: 15 * 60 * 1000, // 15 minutes
  REFRESH: 7 * 24 * 60 * 60 * 1000, // 7 days
};
