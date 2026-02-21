import { ForbiddenException } from '@utils/errors';
import crypto from 'crypto';
import { NextFunction } from 'express';

export function generateCsrfToken() {
  return crypto.randomBytes(32).toString('hex');
}

export function verifyCsrfToken(req: Request, res: Response, next: NextFunction) {

  const headerToken = req.headers.get('x-csrf_token') ?? '';
  const cookieToken = req.cookies['csrf_token'] ?? '';

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    throw new ForbiddenException('Csrf token invalid.')
  }

  next();
}

