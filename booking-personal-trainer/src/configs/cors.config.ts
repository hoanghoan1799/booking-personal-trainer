export const CORS_CONFIG = {
  // TODO: Will replace with env
  origin: process.env.FRONTEND_URL ?? '*',

  credentials: true,
};
