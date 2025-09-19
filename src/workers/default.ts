import * as dotenv from 'dotenv';
dotenv.config();

import logger from '@utils/logger';
import { Worker } from 'bullmq';
import { Job } from '@common/constants/job';
import { redis } from '@lib/redis';

const defaultWorker = new Worker(`${process.env.NODE_ENV}-default`, async (job) => {
  console.log(job);
  switch (job.name) {
    default:
      logger.warn(`No job handler for ${job.name}`);
  }
},
  { connection: redis }
);

defaultWorker.on('completed', (job) => {
  logger.info(`Job Completed: ${job.name}`);
});

defaultWorker.on('failed', (job, err) => {
  console.log(job);
  console.log(err);
  logger.error(`Job failed with error: `, err);
});
