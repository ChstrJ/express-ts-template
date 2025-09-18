import { verifyToken } from '@lib/jwt';
import { getAccountBasedOnToken } from '@utils/auth';
import { UnauthorizedException } from '@utils/errors';
import { NextFunction, Request, Response } from 'express';
import { bd } from './bd';

declare global {
  namespace Express {
    interface Request {
      user?: any
    }
  }
}

export async function authenticationMiddleware(req: Request, res: Response, next: NextFunction) {
  if (await bd(req)) {
    return next();
  }

  const accessToken = req.cookies?.access_token ?? req.headers['authorization']?.replace('Bearer ', '');

  if (!accessToken) throw new UnauthorizedException('No access token found.');

  const payload = verifyToken(accessToken);

  if (!payload) {
    throw new UnauthorizedException('Token is not valid.');
  }

  req.user = await getAccountBasedOnToken(payload);

  next();
}
