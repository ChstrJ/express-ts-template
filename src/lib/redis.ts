//import { createClient } from "redis";
import dotenv from 'dotenv';
import logger from '../common/utils/logger';
import IORedis from 'ioredis';

dotenv.config();
const password = process.env.REDIS_PASSWORD ?? '';
const port = process.env.REDIS_PORT ?? '';
const host = process.env.REDIS_HOST ?? '';

export const redis = new IORedis({
  host: host,
  port: +port,
  password: password,
  maxRetriesPerRequest: null
});

// const redisClient = createClient({
//   url: url
// });

// redisClient.on('error', (err) => logger.error(`Redis Client Error: ${err}`));

// (async () => {
//   if (process.env.CACHE_ENABLED === 'true' && !redisClient.isOpen) {
//     await redisClient.connect();
//   }
// })();

// export default redisClient;
