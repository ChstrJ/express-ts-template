import { redis } from '@lib/redis';
import { Queue } from 'bullmq';

export const criticalQueue = new Queue('critical', { connection: redis });
