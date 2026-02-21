import dotenv from 'dotenv';

dotenv.config();

export const app = {
  nodePort: Number(process.env.NODE_PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  appUrl: process.env.APP_URL || 'http://localhost:3000'
};
