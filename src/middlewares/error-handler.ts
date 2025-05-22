import { Request, Response, NextFunction } from 'express';
import logger from '../common/utils/logger';
import { makeError } from '../common/utils/errors';

export default function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const { error, statusCode } = makeError(err);

  logger.error(error);

  const response = {
    error: true,
    timestamp: Date.now(),
    //message: error.message || 'An error occured.',
    code: statusCode,
  };

  res.status(statusCode || 500).json(response);
}
