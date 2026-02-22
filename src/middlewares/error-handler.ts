import { NextFunction, Request, Response } from 'express';
import { makeError } from '@utils/errors';
import dotenv from 'dotenv';
dotenv.config();

export default function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  const { account_id } = req.user || {};
  const isProduction = process.env.NODE_ENV === 'production';
  const { statusCode, error, message } = makeError(err);

  const response = {
    error: true,
    timestamp: Date.now(),
    message: message || 'An error occured.',
    code: statusCode,
    stack: process.env.DEBUG === 'true' ? err.stack : []
  };

  res.status(statusCode || 500).json(response);
}
