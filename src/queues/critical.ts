import { redis } from '@lib/redis';
import { Queue } from 'bullmq';
import dotenv from 'dotenv';

dotenv.config();

export const criticalQueue = new Queue(`${process.env.NODE_ENV}-critical`, { connection: redis });
