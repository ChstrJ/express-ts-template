import dayjs from 'dayjs';
import { QueryParams } from './pagination';
import { Role } from '@common/constants/roles';
import { sql } from 'kysely';
import { Status } from '@common/constants/status';

export const filterByAccount = (baseQuery: any, q: QueryParams, table: string) => {
  if (q.account_id && Array.isArray(q.account_id) && q.account_id.length > 0) {
    return baseQuery.where(`${table}.account_id`, 'in', q.account_id);
  } else if (q.account_id) {
    return baseQuery.where(`${table}.account_id`, '=', q.account_id);
  }

  return baseQuery;
};

export const filterByAccountStatus = (baseQuery: any, q: QueryParams, table: string) => {
  if (q.account_status && Array.isArray(q.account_status) && q.account_status.length > 0) {
    return baseQuery.where(`${table}.account_status`, 'in', q.account_status);
  } else if (q.account_status) {
    return baseQuery.where(`${table}.account_status`, '=', q.account_status);
  }
  return baseQuery;
};

export const filterByOrderStatus = (baseQuery: any, q: QueryParams, table: string) => {
  if (q.order_status) {
    return baseQuery.where(`${table}.order_status`, '=', q.order_status);
  }
  return baseQuery;
};

export const filterByOrderPaymentStatus = (baseQuery: any, q: QueryParams, table: string) => {
  if (q.order_payment_status) {
    return baseQuery.where(`${table}.order_payment_status`, '=', q.order_payment_status);
  }
  return baseQuery;
};


export const filterByPaymentStatus = (baseQuery: any, q: QueryParams, table: string) => {
  if (q.payment_status) {
    return baseQuery.where(`${table}.order_payment_status`, '=', q.payment_status);
  }
  return baseQuery;
};

export const filterByCommissionType = (baseQuery: any, q: QueryParams, table: string) => {
  if (q.commission_type) {
    return baseQuery.where(`${table}.commission_type`, '=', q.commission_type);
  }
  return baseQuery;
};

export const filterByPackage = (baseQuery: any, q: QueryParams) => {
  if (q.product_package_id && Array.isArray(q.product_package_id) && q.product_package_id.length > 0) {
    return baseQuery.where(`pp.product_package_id`, 'in', q.product_package_id);
  } else if (q.product_package_id) {
    return baseQuery.where(`pp.product_package_id`, '=', q.product_package_id);
  }

  return baseQuery;
};

export const filterByWithdrawalStatus = (baseQuery: any, q: QueryParams, table: string) => {
  if (q.withdrawal_status) {
    return baseQuery.where(`${table}.withdrawal_status`, '=', q.withdrawal_status);
  }
  return baseQuery;
};

export const filterByTicket = (baseQuery: any, q: QueryParams, table: string) => {
  if (q.tkt) {
    return baseQuery.where(`${table}.ticket_number`, 'LIKE', `%${q.tkt}%`);
  }
  return baseQuery;
};

export const filterByChatType = (baseQuery: any, q: QueryParams, table: string) => {
  if (q.chat_type) {
    return baseQuery.where(`${table}.chat_type`, '=', q.chat_type);
  }
  return baseQuery;
};

export const filterByRole = (baseQuery: any, q: QueryParams, table: string) => {
  if (q.chat_type) {
    return baseQuery.where(`${table}.chat_type`, '=', q.chat_type);
  }
  return baseQuery;
};

export const filterByDateRange = (baseQuery: any, q: QueryParams, table: string) => {
  const startDate = q.start_date ? dayjs(q.start_date).startOf('day').format('YYYY-MM-DD HH:mm:ss') : null;

  const endDate = q.end_date ? dayjs(q.end_date).endOf('day').format('YYYY-MM-DD HH:mm:ss') : null;

  if (startDate && endDate) {
    return baseQuery.where(`${table}.created_at`, '>=', startDate).where(`${table}.created_at`, '<=', endDate);
  }

  if (startDate) {
    return baseQuery.where(`${table}.created_at`, '>=', startDate);
  }

  if (endDate) {
    return baseQuery.where(`${table}.created_at`, '<=', endDate);
  }

  return baseQuery;
};

export const filterByMonth = (baseQuery: any, q: QueryParams, table: string) => {
  const month = q.month as string | undefined;

  if (month) {
    const index = q.month - 1; // Adjust for zero-based index
    const startOfMonth = dayjs().month(index).startOf('month').toDate();
    const endOfMonth = dayjs().month(index).endOf('month').toDate();

    baseQuery = baseQuery
      .where(`${table}.created_at`, '>=', startOfMonth)
      .where(`${table}.created_at`, '<=', endOfMonth);
  }

  return baseQuery;
};

export function filterByApprovedOrReady(qb: any) {
  return qb.where((eb: any) => eb.or([
    eb('order_status', '=', Status.APPROVED),
    eb('order_status', '=', Status.READY)
  ]))
}

export function applyRoleListing(qb: any, accountRole: string) {
  if (accountRole === Role.WAREHOUSE) {
    qb = qb.where(
      sql`o.order_status = ${Status.PENDING} OR
         o.order_status = ${Status.APPROVED} OR 
         op.order_payment_status = ${Status.VERIFIED}`
    );
  }

  if (accountRole === Role.FINANCE) {
    qb = qb.where('o.order_status', '=', Status.APPROVED);
  }

  return qb;
}