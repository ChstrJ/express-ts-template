import { Role } from '@common/constants/roles';
import { NextFunction, Request, Response } from 'express';
import dotenv from 'dotenv';
import { ForbiddenException } from '@utils/errors';
import db from 'src/db/db-client';

dotenv.config();

export default function permissionMiddleware(routeKey: string) {
  return async function (req: Request, res: Response, next: NextFunction) {
    const { account_id, account_role } = req.user;

    if (process.env.PERMISSION_ENABLED === 'false') {
      return next();
    }

    const permission = await db
      .selectFrom('account as a')
      .leftJoin('account_permission as ap', 'a.account_id', 'ap.account_id')
      .select(['ap.permission_meta'])
      .where('a.account_id', '=', account_id)
      .executeTakeFirst();

    if (!permission) {
      return next();
    }

    if (![Role.ADMIN, Role.SUPER_ADMIN].includes(account_role)) {
      throw new ForbiddenException('For admin only.');
    }

    if (!permission?.permission_meta[routeKey]?.access) {
      throw new ForbiddenException('Access denied.');
    }

    return next();
  };
}
