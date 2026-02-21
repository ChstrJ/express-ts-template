import { filterByAccount } from '@utils/filters';
import { applyPagination, generateMeta, getTotalRecords, getTotalRecordsDistinct, QueryParams } from '@utils/pagination';
import { applySearch } from '@utils/search';
import { sql } from 'kysely';
import db from 'src/db/db-client';

export const accountActivityRepository = {
  async getAccountActivities(q: QueryParams) {
    const baseQuery = db
      .selectFrom('account_activity as aa')
      .innerJoin('account as a', 'aa.account_id', 'a.account_id');

    const totalRecords = await getTotalRecords(baseQuery);

    const data = await baseQuery
      .select([
        'aa.account_activity_id',
        'a.account_id',
        sql`CONCAT(a.account_first_name, ' ', a.account_last_name)`.as('admin_name'),
        'aa.activity_message',
        'aa.action',
        'aa.activity_type',
        'aa.created_at',
        'aa.updated_at',
      ])
      .$call((eb) => applyPagination(eb, q))
      .$call((eb: any) => applySearch(eb, q, 'aa', ['activity_message', 'action', 'activity_type']))
      .orderBy('created_at', 'desc')
      .execute();

    const meta = generateMeta(q, totalRecords);

    return { data, meta };
  }
};
