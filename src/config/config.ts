import dotenv from 'dotenv';

dotenv.config();

const config = {
  app: {
    nodePort: Number(process.env.NODE_PORT) || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
  },
  jwt: {
    jwtSecret: process.env.JWT_SECRET || '',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '',
    jwtRefreshTokenExpiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRES_IN || '',
  },
};

export default config;
