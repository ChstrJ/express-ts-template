import db from 'src/db/db-client';
import { QueryParams, applyPagination, generateMeta, getTotalRecords } from '@utils/pagination';
import { NotFoundException } from '@utils/errors';
import { sql } from 'kysely';
import { Status } from '@common/constants/status';
import { getImageUrl } from '@utils/helpers';
import _ from 'lodash';

export const withdrawalService = {
  listWithdrawals: async (q: QueryParams) => {
    const baseQuery = db
      .selectFrom('withdrawal as w')
      .innerJoin('account as a', 'a.account_id', 'w.account_id')
      .leftJoin('account_payment_method as apm', 'a.account_id', 'apm.account_id');

    const totalRecords = await getTotalRecords(baseQuery);

    const records = await baseQuery
      .select([
        'a.account_email',
        'a.account_contact_number',
        'w.withdrawal_id',
        'w.account_id',
        'w.withdrawal_amount',
        'w.withdrawal_status',
        'w.ref_no',
        'apm.payment_method',
        'apm.payment_method_name',
        'apm.payment_method_number',
        'apm.payment_method_qr_code',
        'w.created_at',
        'w.updated_at',
      ])
      .$call((eb) => applyPagination(eb, q))
      .orderBy('created_at', 'desc')
      .execute();

    const data = records.map((record: any) => ({
      ...record,
      payment_method_qr_code: getImageUrl(record.payment_method_qr_code),
    }));

    const meta = generateMeta(q, totalRecords);

    return { data, meta };
  },

  findWithdrawal: async (withdrawalId: string) => {
    const data = await db
      .selectFrom('withdrawal as w')
      .innerJoin('account as a', 'a.account_id', 'w.account_id')
      .leftJoin('account_payment_method as apm', 'a.account_id', 'apm.account_id')
      .leftJoin('wallet_transaction as wt', 'wt.withdrawal_id', 'w.withdrawal_id')
      .innerJoin('wallet as wl', 'wl.wallet_id', 'wt.wallet_id')
      .select([
        'a.account_email',
        'a.account_contact_number',
        'apm.payment_method',
        'apm.payment_method_name',
        'apm.payment_method_number',
        'apm.payment_method_qr_code',
        'wt.wallet_id',
        'w.withdrawal_id',
        'w.ref_no',
        'w.account_id',
        'w.withdrawal_amount',
        'w.withdrawal_status',
        'w.created_at',
        'w.updated_at',
      ])
      .where('w.withdrawal_id', '=', withdrawalId)
      .executeTakeFirstOrThrow(() => new NotFoundException('Withdrawal not found.'));

    return {
      ...data,
      payment_method_qr_code: getImageUrl(data.payment_method_qr_code),
    };
  },

  sumWithdrawal: async () => {
    const data = await db
      .selectFrom('withdrawal')
      .select([sql<number>`SUM(withdrawal_amount)`.as('total_amount')])
      .where('withdrawal_status', '=', Status.COMPLETED)
      .executeTakeFirst();

    return data?.total_amount ?? 0;
  },

  withdrawalStats: async () => {
    const data = await db
      .selectFrom('withdrawal as w')
      .select([
        sql<number>`SUM(w.withdrawal_status = ${Status.PENDING})`.as('total_pending'),
        sql<number>`SUM(w.withdrawal_status = ${Status.PROCESSING})`.as('total_processing'),
        sql<number>`SUM(w.withdrawal_status = ${Status.COMPLETED})`.as('total_completed'),
      ])
      .executeTakeFirst();

    return {
      totalPending: data?.total_pending ?? 0,
      totalProcessing: data?.total_processing ?? 0,
      totalCompleted: data?.total_completed ?? 0,
    };
  },
};