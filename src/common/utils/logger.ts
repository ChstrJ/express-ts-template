import pino from 'pino';
import dotenv from 'dotenv';

dotenv.config();

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

const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:mm-dd-yyyy hh:mm:ss TT'
    }
  },
  level: process.env.LOG_LEVEL || 'info'
});

export default logger;
