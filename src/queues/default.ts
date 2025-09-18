import { redis } from '@lib/redis';
import { Queue } from 'bullmq';
import dotenv from 'dotenv';

dotenv.config();

export const defaultQueue = new Queue(`${process.env.NODE_ENV}-default`, { connection: redis });
