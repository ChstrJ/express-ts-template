import pino from 'pino';

const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: "SYS:mm-dd-yyyy hh:mm:ss TT",
    },
  },
  level: process.env.LOG_LEVEL || 'info',
});

export default logger;

