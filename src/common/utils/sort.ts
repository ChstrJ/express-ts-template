import { QueryParams } from './pagination';

const SORT_BY = ['desc', 'asc'];

export const applySorting = (baseQuery: any, q: QueryParams, table: string) => {
  if (q.sort_by && q.sort_order && SORT_BY.includes(q.sort_order)) {
    return baseQuery.orderBy(`${table}.${q.sort_by}`, q.sort_order || 'desc');
  }

  return baseQuery.orderBy(`${table}.created_at`, 'desc');
}