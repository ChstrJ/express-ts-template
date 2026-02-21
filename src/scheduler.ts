import cron from 'node-cron';
import { commissionService } from '@features/commission/commission.service';
import dayjs from 'dayjs';
import logger from '@utils/logger';
import { CommissionJob } from './jobs/commission';
import { JobType } from '@common/constants/job';
import { BonusJob } from './jobs/bonus';

cron.schedule(
  '0 0 1 * *', // Run at 12:00 AM on the 1st day of each month
  async () => {
    await commissionService.voidCommissions();
  },
  {
    timezone: 'Asia/Manila'
  }
);

cron.schedule(
  '0 0 1 * *', // Run at 12:00 AM on the 1st day of each month
  async () => {
    logger.info('Adding bonus release job to queue...');
    await BonusJob.addToQueue({
      type: JobType.BONUS
    })
  },
  {
    timezone: 'Asia/Manila'
  }
);

cron.schedule(
  '*/5 * * * *', // Run every 5 minutes
  async () => {
    logger.info('Checking to release on-hold commissions...');
    const now = dayjs();

    if (now.date() === 1 && now.hour() < 2) {
      logger.info('Skipping task — new month started (first 2 hours).');
      return;
    }

    await CommissionJob.addToQueue({
      type: JobType.ON_HOLD_COMMISSION
    })
  },
  {
    timezone: 'Asia/Manila'
  }
);

// cron.schedule(
//   '0 0 22 * *', // Run at 12:00 AM on the 22nd day of each month
//   async () => {
//     await commissionService.releaseCutOffCommissionV2();
//     await commissionService.releaseCutOffOnHoldCommissions();
//   },
//   {
//     timezone: 'Asia/Manila'
//   }
// );

// cron.schedule('* * * * *',
//   () => {
//     logger.info('Scheduler test log');
//   },
//   {
//     timezone: 'Asia/Manila'
//   }
// );

// cron.schedule(
//   '0 0 1 * *', // Run at 12:00 AM on the 1st day of each month
//   async () => {
//       const date = dayjs();
//       logger.info('Running computeCutoffCommission for 1st cutoff');
//       await commissionService.computeCutoffCommission(date);
//       logger.info('Finished computeCutoffCommission for 1st cutoff');
//   },
//   {
//     timezone: 'Asia/Manila'
//   }
// );

// cron.schedule(
//   '0 0 8 * *', // Run at 12:00 AM on the 8th day of each month
//   async () => {
//       const date = dayjs();
//       logger.info('Running computeCutoffCommission for 8th cutoff');
//       await commissionService.computeCutoffCommission(date);
//       logger.info('Finished computeCutoffCommission for 8th cutoff');
//   },
//   {
//     timezone: 'Asia/Manila'
//   }
// );

// cron.schedule(
//   '0 0 22 * *', // Run at 12:00 AM on the 22nd day of each month
//   async () => {
//       const date = dayjs();
//       logger.info('Running computeCutoffCommission for 22nd cutoff');
//       await commissionService.computeCutoffCommission(date);
//       logger.info('Finished computeCutoffCommission for 22nd cutoff');
//   },
//   {
//     timezone: 'Asia/Manila'
//   }
// );
