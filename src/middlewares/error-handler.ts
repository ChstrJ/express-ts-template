import { NextFunction, Request, Response } from 'express';
import { makeError } from '@utils/errors';
import dotenv from 'dotenv';
import logger from '@utils/logger';
dotenv.config();

export default function globalErrorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  const { account_id } = req.user || {};
  const isProduction = process.env.NODE_ENV === 'production';
  const { statusCode, message, code } = makeError(err);

  logger.error({
    environment: process.env.NODE_ENV,
    account_id: account_id || 'unknown',
    code: code,
    message: err.message,
    stack: err.stack,
  })

  const response = {
    error: true,
    timestamp: Date.now(),
    message: message || 'An error occurred.',
    status: statusCode,
    code: code,
    stack: !isProduction ? err.stack : undefined
  };

  res.status(statusCode || 500).json(response);
}
