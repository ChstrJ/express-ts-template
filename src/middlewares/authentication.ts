import { verifyToken } from '@lib/jwt';
import { UnauthorizedException } from '@utils/errors';
import { NextFunction, Request, Response } from 'express';
import { Account } from 'src/db/generated/generated-types';

declare global {
  namespace Express {
    interface Request {
      user?: Partial<Account> | null | any;
    }
  }
}

export async function authenticationMiddleware(req: Request, res: Response, next: NextFunction) {
  const accessToken = req.cookies?.access_token ?? req.headers['authorization']?.replace('Bearer ', '');

  if (!accessToken) throw new UnauthorizedException('No access token found.');

  const payload = verifyToken(accessToken);

  if (!payload) {
    throw new UnauthorizedException('Token is not valid.');
  }

  req.user = [];

  next();
}
