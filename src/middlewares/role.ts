import { ForbiddenException } from '@utils/errors';
import { NextFunction, Request, Response } from 'express';

export const roleMiddleware = (role: string | string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const { account_role } = req.user;

    const message = `Access denied for role: ${account_role}`;

    if (Array.isArray(role)) {
      if (!role.includes(account_role)) {
        throw new ForbiddenException(message);
      }
    } else {
      if (account_role !== role) {
        throw new ForbiddenException(message);
      }
    }

    next();
  };
};
