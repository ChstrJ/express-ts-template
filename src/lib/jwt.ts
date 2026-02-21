import config from '@config/config';
import { UnauthorizedException } from '@utils/errors';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

export const signAccessToken = (payload: object) => {
  return jwt.sign({ ...payload, jti: uuidv4() }, config.jwt.jwtSecret, { expiresIn: '1d' });
};

export const signRefreshToken = (payload: object) => {
  return jwt.sign({ ...payload, jti: uuidv4() }, config.jwt.jwtSecret, { expiresIn: '30d' });
};

export const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, config.jwt.jwtSecret);
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      throw new UnauthorizedException('token_expired');
    }
  }
};
