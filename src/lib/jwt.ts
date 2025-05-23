import config from "@root/config/config";
import jwt from 'jsonwebtoken';

export const signAccessToken = (payload: object) => {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: '15m' });
};

export const signRefreshToken = (payload: object) => {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: '7d' });
};

export const verifyToken = (token: string) => {
  return jwt.verify(token, config.jwtSecret);
};
