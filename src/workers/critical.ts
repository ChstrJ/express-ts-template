import { Job } from '@common/constants/job';
import { redis } from '@lib/redis';
import logger from '@utils/logger';
import { Worker } from 'bullmq';
import { DisburseCommissionJob } from 'src/jobs/disburse-commission';

const criticalWorker = new Worker('critical', async (job) => {
  switch (job.name) {
    case Job.DISBURSE_COMMISSION:
      await DisburseCommissionJob.handle(job.data);
      break;
    default:
      throw new Error(`Unknown job name: ${job.name}`);
  }
},
  { connection: redis }
);

criticalWorker.on('completed', (job) => {
  logger.info(`Critical Job Completed: ${job.name}`);
});

criticalWorker.on('failed', (job, err) => {
  logger.error(`Critical Job ${job?.name} failed with error: `, err);
});

export default criticalWorker;
