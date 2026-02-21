import * as Sentry from '@sentry/node';
import dotenv from 'dotenv';

dotenv.config();

export const initSentry = () => {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    sendDefaultPii: true,
    environment: process.env.NODE_ENV ?? 'production',
    tracesSampleRate: 1.0,
    _experiments: {
      enableLogs: true
    }
  });
};

export const SentryCaptureStackTrace = (err: unknown) => {
  return Sentry.captureException(err);
};

export const sentryLogger = Sentry.logger;
