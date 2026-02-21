import { Queue } from 'bullmq';

export abstract class BaseJob {
  protected static jobName: string = '';
  protected static queue: Queue | string | any;
  protected static attempts: number = 3;
  protected static backoff = {
    type: 'exponential',
    delay: 5000
  };

  protected static get jobOptions() {
    return {
      attempts: this.attempts,
      backoff: this.backoff,
      removeOnComplete: true,
    };
  }

  protected constructor() {}

  static async addToQueue(data: any) {
    await this.queue.add(this.jobName, data, this.jobOptions);
  }

  static async addToQueueWithDelay(data: any, delay: number) {
    await this.queue.add(this.jobName, data, {
      ...this.jobOptions,
      delay
    });
  }

  static async addToQueueWithPriority(data: any, priority: number) {
    await this.queue.add(this.jobName, data, {
      ...this.jobOptions,
      priority
    });
  }
}
