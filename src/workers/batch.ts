import { redis } from '@lib/redis';
import logger from '@utils/logger';
import { Worker } from 'bullmq';

// Define your batch job handlers here
// e.g., import { ReportGenerationJob } from "src/jobs/report-generation";

const batchWorker = new Worker(
  'batch',
  async (job) => {
    // Example of routing jobs based on their name
    // switch (job.name) {
    //     case 'generate-weekly-report':
    //         await ReportGenerationJob.handle(job.data);
    //         break;
    //     default:
    //         throw new Error(`Unknown job name: ${job.name}`);
    // }
  },
  { connection: redis }
);

batchWorker.on('completed', (job) => {
  logger.info(`Batch Job Completed: ${job.name}`);
});

batchWorker.on('failed', (job, err) => {
  logger.error(`Batch Job ${job?.name} failed with error: `, err);
});

export default batchWorker;
