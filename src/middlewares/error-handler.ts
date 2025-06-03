import { Request, Response, NextFunction } from 'express';
import logger from '../common/utils/logger';
import { makeError } from '../common/utils/errors';

export default function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const { statusCode, error } = makeError(err);

  logger.error(error);

  const response = {
    error: true,
    timestamp: Date.now(),
    message: err.message || 'An error occured.',
    code: statusCode,
    stack: err.stack
  };

  res.status(statusCode || 500).json(response);
}
