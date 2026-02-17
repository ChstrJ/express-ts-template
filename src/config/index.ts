import { env } from "./env";

export const config = {
  app: {
    port: env.PORT,
    env: env.NODE_ENV,
    isProduction: env.NODE_ENV === 'production',
  },

  db: {
    mysql: {
      host: env.DB_HOST,
      port: env.DB_PORT,
      user: env.DB_USER,
      password: env.DB_PASSWORD,
      database: env.DB_DATABASE,
    }
  },

  redis: {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD,
  },
};
