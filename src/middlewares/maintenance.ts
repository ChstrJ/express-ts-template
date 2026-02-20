import { ForbiddenError } from '@utils/errors';
import dotenv from 'dotenv';
dotenv.config();
import { Request, Response, NextFunction } from 'express';

export const maintenance = (req: Request, res: Response, next: NextFunction) => {
  const isMaintenanceEnabled = process.env.MAINTENANCE_ENABLED === 'true';

  if (isMaintenanceEnabled) {
    throw new ForbiddenError('App maintenance is in progress.');
  }

  next();
};
