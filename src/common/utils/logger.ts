import pino from 'pino';
import dotenv from 'dotenv';
import { sentryLogger } from '@lib/sentry';

dotenv.config();

process.env.TZ = 'Asia/Manila';

let logger: typeof sentryLogger | any;

// if (process.env.NODE_ENV !== 'production') {
//   logger = pino({
//     transport: {
//       target: 'pino-pretty',
//       options: {
//         colorize: true,
//         translateTime: 'SYS:mm-dd-yyyy hh:mm:ss TT'
//       }
//     },
//     level: process.env.LOG_LEVEL || 'info'
//   });
// } else {
//   logger = sentryLogger;
// }

logger = pino({
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'mm-dd-yyyy HH:MM:ss "PHT"',
      ignore: 'pid,hostname',
    }
  },
  level: process.env.LOG_LEVEL || 'info'
});

export default logger;
