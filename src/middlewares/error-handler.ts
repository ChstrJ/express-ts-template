import { NextFunction, Request, Response } from 'express';
import { makeError } from '@utils/errors';
import dotenv from 'dotenv';
import logger from '@utils/logger';
import { SentryCaptureStackTrace } from '@lib/sentry';
dotenv.config();

export default function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  const { account_id } = req.user || {};
  const isProduction = process.env.NODE_ENV === 'production';
  const { statusCode, error, message } = makeError(err);

  if (statusCode >= 500) {
    SentryCaptureStackTrace(err);
  }

  if (isProduction) {
    logger.error(`account_id: ${account_id || 'unknown |'}` + err.message, { stack: err.stack });
  } else {
    logger.error(error);
  }

  const response = {
    error: true,
    timestamp: Date.now(),
    message: message || 'An error occured.',
    code: statusCode,
    stack: process.env.DEBUG === 'true' ? err.stack : []
  };

  res.status(statusCode || 500).json(response);
}
