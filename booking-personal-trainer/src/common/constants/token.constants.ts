export const TOKEN = {
  ACCESS: 'access',
  REFRESH: 'refresh',
};

export const TOKEN_EXPIRATION = {
  ACCESS: '15m',
  REFRESH: '7d',
} as const;

export const TOKEN_COOKIE = {
  ACCESS: 'access_token',
  REFRESH: 'refresh_token',
};
