import { defaultQueue } from 'src/queues/default';
import { BaseJob } from './base';
import { sendNotif } from '@utils/helpers';
import db from 'src/db/db-client';
import { Job } from '@common/constants/job';

export class AlertJob extends BaseJob {
  protected static jobName = Job.ALERT;
  protected static queue = defaultQueue;
  private static notifCode = '';

  public static async handle(data: any) {
    this.notifCode = data.code;

    if ((data.role && Array.isArray(data.role)) || typeof data.role === 'string') {
      data.ids = await this.getAccountIdsByRole(data.role);
    }

    await sendNotif(data.ids, this.notifCode, data.content);

    return 'sent';
  }

  public static async getAccountIdsByRole(role: string | string[]) {
    const accountIds = await db.selectFrom('account').select(['account_id']).where('account_role', 'in', role).execute();

    return accountIds.map((account) => account.account_id);
  }
}
