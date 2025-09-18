import { sanitizeAndTrim } from '@utils/helpers';
import { Request, Response, NextFunction } from 'express';
import _ from 'lodash';

export const sanitize = (req: Request, res: Response, next: NextFunction) => {
  let queryParams = req.query;

  if (!queryParams) {
    return next();
  }

  for (const key in queryParams) {
    queryParams[key] = sanitizeAndTrim(queryParams[key]);
  }

  next();
};
