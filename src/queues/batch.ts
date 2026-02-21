import { redis } from '@lib/redis';
import { Queue } from 'bullmq';

export const batchQueue = new Queue('batch', { connection: redis });
