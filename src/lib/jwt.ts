import config from "@root/config/config";
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

export const signAccessToken = (payload: object) => {
  return jwt.sign({ ...payload, jti: uuidv4() }, config.jwt.jwtSecret, { expiresIn: '15m' });
};

export const signRefreshToken = (payload: object) => {
  return jwt.sign({ ...payload, jti: uuidv4() }, config.jwt.jwtSecret, { expiresIn: '7d' });
};

export const verifyToken = (token: string) => {
  return jwt.verify(token, config.jwt.jwtSecret);
};
