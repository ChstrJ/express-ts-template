import { Role } from '@common/constants/roles';
import { ForbiddenException } from '@utils/errors';
import { NextFunction, Request, Response } from 'express';

export async function adminMiddleware(req: Request, res: Response, next: NextFunction) {
  const { account_role } = req.user;

  if (![Role.ADMIN, Role.SUPER_ADMIN].includes(account_role)) {
    throw new ForbiddenException('For admin only.');
  }

  next();
}
