import { Resource } from '@common/constants/resource';
import { sql } from 'kysely';
import _ from 'lodash';

export type QueryParams = {
  limit?: string;
  offset?: string;
  order_by?: string;
  order?: 'asc' | 'desc';
  [key: string]: any;
};

// const ALLOWED_SORT_FIELDS: Record<string, string> = {
//     created_at: 'a.created_at',
//     email: 'a.account_email',
//     name: 'a.account_first_name',
//     status: 'a.account_status',
// };

export function pagination(q: QueryParams) {
  const defaultPerPage = Resource.PER_PAGE;
  const defaultPage = Resource.PAGE;
  const defaultOrderBy = 'created_at';
  const defaultOrder = 'desc';

  let perPage = q.per_page !== undefined && !_.isEmpty(q.per_page) ? +q.per_page : defaultPerPage;

  let page = q.page !== undefined && !_.isEmpty(q.page) ? +q.page - 1 : defaultPage - 1;

  let orderBy = q.order_by !== undefined && !_.isEmpty(q.order_by) ? q.order_by.toLowerCase() : defaultOrderBy;

  let order = q.order !== undefined && !_.isEmpty(q.order) ? q.order.toLowerCase() : defaultOrder;

  if (perPage <= 0) {
    perPage = defaultPerPage;
  }

  if (perPage > Resource.MAX_LIMIT) {
    perPage = Resource.MAX_LIMIT;
  }

  if (page < 0) {
    page = defaultPage - 1;
  }

  if (order !== 'asc' && order !== 'desc') {
    order = defaultOrder;
  }

  return { page, perPage, orderBy, order };
}

export function generateMeta(q: QueryParams, total: number) {
  const { page, perPage } = pagination(q);

  const total_pages = Math.ceil(total / perPage);

  return {
    per_page: perPage,
    page: page + 1,
    total_rows: total,
    total_pages: total_pages
    //order_by: orderBy,
    //order: order,
  };
}

export function applySearch(qb: any, q: QueryParams) {
  if (q.name) {
    return qb.where(sql`CONCAT(a.account_first_name, ' ', a.account_last_name)`, 'like', `%${q.name}%`);
  }

  return qb;
}

export function applyLimit(qb: any, q: QueryParams) {
  if (q.limit) {
    return qb.limit(+q.limit);
  }

  return qb.limit(10);
}

export function applyPagination(qb: any, q: QueryParams) {
  const { page, perPage } = pagination(q);

  if (page >= 0 && perPage) {
    qb = qb.limit(perPage).offset(page * perPage);
  }

  return qb;
}

export async function getTotalRecords(query: any) {
  const result = await query
    .clearSelect() // removes all selected columns
    .clearOrderBy() // removes ORDER BY if present
    .select((eb: any) => eb.fn.countAll().as('count'))
    .executeTakeFirst();

  return result?.count ? Number(result.count) : 0;
}

export async function getTotalRecordsGroup(query: any) {
  const result = await query
    .clearSelect()
    .clearOrderBy()
    .select(sql<number>`COUNT(DISTINCT a.account_id)`.as('count'))
    .executeTakeFirst();

  return result?.count ? Number(result.count) : 0;
}
