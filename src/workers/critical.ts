import { Job } from '@common/constants/job';
import { redis } from '@lib/redis';
import logger from '@utils/logger';
import { Worker } from 'bullmq';
import { BonusJob } from 'src/jobs/bonus';
import { CommissionJob } from 'src/jobs/commission';
import { RankJob } from 'src/jobs/rank';

const criticalWorker = new Worker(`${process.env.NODE_ENV}-critical`, async (job) => {
  logger.info(`Processing Critical Job: ${job.name}`);
  switch (job.name) {
    case Job.COMMISSION:
      await CommissionJob.handle(job.data);
      break;
    case Job.BONUS:
      await BonusJob.handle(job.data);
      break;
    case Job.RANK:
      await RankJob.handle(job.data);
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
  console.log(err);
  logger.error(`Critical Job ${job?.name} failed with error: `, err);
});

export default criticalWorker;
