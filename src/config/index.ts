import dotenv from 'dotenv';

dotenv.config();

export const config = {
  app: {
    port: process.env.PORT ?? 3000,
    env: process.env.NODE_ENV ?? 'development',
    isProduction: process.env.NODE_ENV === 'production',
    appUrl: process.env.APP_URL || 'http://localhost:3000',
    appUrls: [process.env.APP_URL ?? '', 'http://localhost:3001', 'http://localhost:3002']
  },

  db: {
    mysql: {
      host: process.env.DATABASE_HOST,
      port: process.env.DATABASE_PORT,
      user: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_DATABASE,
    }
  },

  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD,
  },

  jwt: {
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN,
    jwtRefreshTokenExpiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRES_IN
  }
};
