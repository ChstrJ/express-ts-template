import dotenv from 'dotenv';

dotenv.config();

const config = {
  app: {
    nodePort: Number(process.env.NODE_PORT) || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    appUrl: process.env.APP_URL || 'http://localhost:3000',
    appUrls: [process.env.APP_URL ?? '', 'http://localhost:3001', 'http://localhost:3002']
  },
  jwt: {
    jwtSecret: process.env.JWT_SECRET || '',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '',
    jwtRefreshTokenExpiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRES_IN || ''
  }
};

export default config;
