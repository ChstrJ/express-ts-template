import dotenv from 'dotenv';

dotenv.config();

export const redis = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: Number(process.env.REDIS_PORT) || 6376,
  username: process.env.REDIS_USERNAME || '',
  password: process.env.REDIS_PASSWORD || ''
};
