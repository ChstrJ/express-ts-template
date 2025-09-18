import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { TooManyRequestException } from '@utils/errors';
import { Request, Response, NextFunction } from 'express';
dotenv.config();

const isRateLimitEnabled = process.env.RATELIMIT_ENABLED === 'true';

export const limiter = isRateLimitEnabled
  ? rateLimit({
      windowMs: 1 * 60 * 1000,
      limit: 100,
      standardHeaders: 'draft-8',
      legacyHeaders: false,
      handler: () => {
        throw new TooManyRequestException('Too many requests, Please try again later.');
      }
    })
  : (req: Request, res: Response, next: NextFunction) => next();
