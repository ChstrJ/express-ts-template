import { Role } from '@common/constants/roles';
import { Status } from '@common/constants/status';
import { getSixMonthsAgo } from '@utils/date';
import {
  filterByAccount,
  filterByAccountStatus,
  filterByCommissionType,
  filterByDateRange,
  filterByOrderStatus,
  filterByPackage,
  filterByPaymentStatus,
  filterByWithdrawalStatus
} from '@utils/filters';
import { applyPagination, generateMeta, getTotalRecords, getTotalRecordsDistinct, getTotalRecordsSub, QueryParams } from '@utils/pagination';
import { applySearch } from '@utils/search';
import { sql } from 'kysely';
import db from 'src/db/db-client';

export const reportsRepository = {
  async getAllOrders(q: QueryParams, paginate: boolean = false) {
    const baseQuery = db
      .selectFrom('order as o')
      .leftJoin('order_payment as op', 'o.order_id', 'op.order_id')
      .leftJoin('payment_method as pm', 'op.payment_method_id', 'pm.payment_method_id')
      .leftJoin('account as a', 'o.account_id', 'a.account_id')
      .where('a.account_role', '=', Role.DISTRIBUTOR)

    const totalRecords = await getTotalRecords(baseQuery);

    let query = baseQuery
      .select([
        'a.account_id',
        'pm.payment_method_id',
        sql`CONCAT(a.account_first_name, ' ', a.account_last_name)`.as('ordered_by'),
        'a.account_contact_number',
        'op.order_payment_image',
        'op.order_payment_status',
        'pm.payment_method',
        'o.total_amount',
        'o.order_status',
        'o.created_at',
        'o.updated_at'
      ])
      .$call((qb) => filterByAccount(qb, q, 'a'))
      .$call((qb: any) => filterByDateRange(qb, q, 'o'))
      .$call((qb: any) => filterByOrderStatus(qb, q, 'o'))
      .$call((qb: any) => filterByPaymentStatus(qb, q, 'op'))

    if (paginate) {
      query = query.$call((qb: any) => applyPagination(qb, q))
    }

    const data = await query.orderBy('o.created_at', 'desc').execute();

    const meta = generateMeta(q, totalRecords);

    return { data, meta };
  },

  async getAllUsers(q: QueryParams, paginate: boolean = false) {
    const baseQuery = db
      .selectFrom('account as a')
      .leftJoin('account_reason as ar', 'a.account_id', 'ar.account_id')
      .leftJoin('referral_code as rc', 'a.account_id', 'rc.account_id')
      .leftJoin('account_product_package as app', 'a.account_id', 'app.account_id')
      .innerJoin('product_package as pp', 'app.product_package_id', 'pp.product_package_id')

    const totalRecords = await getTotalRecords(baseQuery);

    let query = baseQuery
      .select([
        'a.account_id',
        'a.account_email',
        'a.account_first_name',
        'a.account_last_name',
        'a.account_contact_number',
        'a.account_status',
        'a.account_image',
        'pp.product_package_id',
        'pp.product_package_name',
        'ar.reason_message',
        'app.product_package_price',
        'a.created_at',
        'a.updated_at'
      ])
      .$call((qb) => filterByPackage(qb, q))
      .$call((qb: any) => filterByAccount(qb, q, 'a'))
      .$call((qb: any) => filterByAccountStatus(qb, q, 'a'))
      .$call((qb: any) => filterByDateRange(qb, q, 'a'))

    if (paginate) {
      query = query.$call((qb: any) => applyPagination(qb, q))
    }

    const data = await query.orderBy('created_at', 'desc').execute();

    const meta = generateMeta(q, totalRecords);

    return { data, meta };
  },

  async getAllCommissions(q: QueryParams, paginate: boolean = false) {
    const baseQuery = db
      .selectFrom('commission as c')
      .leftJoin('account as a1', 'c.transaction_account_id', 'a1.account_id')
      .leftJoin('account as a2', 'c.account_id', 'a2.account_id')
      .leftJoin('account_product_package as app', 'a1.account_id', 'app.account_id')
      .leftJoin('product_package as pp', 'app.product_package_id', 'pp.product_package_id')

    const totalRecords = await getTotalRecords(baseQuery);

    let query = baseQuery
      .select([
        'pp.product_package_id',
        'pp.product_package_name',
        sql`CONCAT(a2.account_first_name, ' ', a2.account_last_name)`.as('referrer_name'),
        sql`CONCAT(a1.account_first_name, ' ', a1.account_last_name)`.as('referee_name'),
        'c.commission_amount',
        'c.commission_status',
        'c.commission_type',
        'c.created_at',
        'c.updated_at'
      ])
      .$call((qb) => filterByPackage(qb, q))
      .$call((qb: any) => filterByCommissionType(qb, q, 'c'))
      .$call((qb: any) => filterByDateRange(qb, q, 'c'))
      .$call((eb: any) => applySearch(eb, q, 'a1', ['account_first_name', 'account_last_name']))
      .$call((eb: any) => applySearch(eb, q, 'a2', ['account_first_name', 'account_last_name']))

    if (paginate) {
      query = query.$call((qb: any) => applyPagination(qb, q))
    }

    const data = await query.execute();

    const meta = generateMeta(q, totalRecords);

    return { data, meta }
  },

  async getAllWithdrawals(q: QueryParams, paginate: boolean = false) {
    const baseQuery = db
      .selectFrom('withdrawal as w')
      .innerJoin('account as a', 'a.account_id', 'w.account_id')
      .leftJoin('account_payment_method as apm', 'a.account_id', 'apm.account_id')

    const totalRecords = await getTotalRecords(baseQuery);

    let query = baseQuery
      .select([
        'w.ref_no',
        sql`CONCAT(a.account_first_name, ' ', a.account_last_name)`.as('name'),
        'a.account_email',
        'a.account_contact_number',
        'w.withdrawal_amount',
        'w.withdrawal_status',
        'apm.payment_method',
        'apm.payment_method_name',
        'apm.payment_method_number',
        'apm.payment_method_qr_code',
        'w.created_at',
        'w.updated_at'
      ])
      .orderBy('created_at', 'desc')
      .$call((qb) => filterByWithdrawalStatus(qb, q, 'w'))
      .$call((qb: any) => filterByDateRange(qb, q, 'w'))

    if (paginate) {
      query = query.$call((qb: any) => applyPagination(qb, q))
    }

    const records = await query.execute();

    const meta = generateMeta(q, totalRecords);

    return { data: records, meta }
  },

  getAllReports() {
    return [
      {
        title: 'Users Report'
      },
      {
        title: 'Products Report'
      },
      {
        title: 'Commissions Report'
      },
      {
        title: 'Withdrawals Report'
      },
      {
        title: 'Orders Report'
      },
      {
        title: 'Package Sales Report'
      },
      {
        title: 'Product Sales Report'
      }
    ];
  },

  async listNetworkV2(accountId: string, depth: number = 5, q: QueryParams, paginate: boolean = false) {
    const baseQuery = db
      .selectFrom('account_tree_path as atp')
      .innerJoin('account as a', 'atp.descendant_id', 'a.account_id')
      .leftJoin('account_referral as ar', 'a.account_id', 'ar.account_id')
      .leftJoin('account_product_package as app', 'a.account_id', 'app.account_id')
      .leftJoin('product_package as pp', 'app.product_package_id', 'pp.product_package_id')
      .innerJoin('referral_code as rc', 'a.account_id', 'rc.account_id')
      .leftJoin('commission as c', 'a.account_id', 'c.account_id')
      .leftJoin('account_pv as apv', 'a.account_id', 'apv.account_id')
      .where('atp.ancestor_id', '=', accountId)
      .where('atp.depth', '<=', depth)
      .where('a.account_status', '=', Status.ACTIVE)
      .where('a.account_role', '=', Role.DISTRIBUTOR)

    const totalRecords = await getTotalRecordsDistinct(baseQuery, 'a.account_id');

    let query = baseQuery
      .select([
        'a.account_id',
        sql<string>`CONCAT(a.account_first_name, ' ', a.account_last_name)`.as('name'),
        'ar.referred_by_id',
        'a.account_image',
        'pp.product_package_name as package_name',
        'rc.referral_code',
        'atp.depth as level',
        sql<number>`COALESCE(SUM(c.commission_amount), 0)`.as('total_commission'),
        sql<number>`COALESCE(SUM(apv.pv), 0)`.as('total_pv'),
      ])

    if (paginate) {
      query = query.$call((eb) => applyPagination(eb, q));
    }

    const data = await query
      .groupBy([
        'a.account_id',
        'ar.referred_by_id',
        'atp.depth',
        'pp.product_package_name',
        'rc.referral_code',
        'a.account_image',
        'a.account_first_name',
        'a.account_last_name',
      ])
      .orderBy('atp.depth')
      .execute();

    const meta = generateMeta(q, totalRecords);

    return { data, meta }
  },

  async unreleasedCommission(q: QueryParams, paginate: boolean = false) {
    let baseQuery = db
      .selectFrom('account as a')
      .leftJoin('commission as c', 'c.account_id', 'a.account_id')
      .leftJoin('withdrawal as w', 'a.account_id', 'w.account_id')
      .select([
        'a.account_id',
        sql`CONCAT(a.account_first_name, ' ', a.account_last_name)`.as('name'),
        'a.account_email',
        'a.account_contact_number',
        sql`COALESCE(SUM(c.commission_amount), 0) - COALESCE(SUM(w.withdrawal_amount), 0)`.as('unreleased_commission'),
        'a.created_at'
      ])
      .where('a.account_role', '=', Role.DISTRIBUTOR)
      .groupBy([
        'a.account_id',
      ])
      .having(
        sql`COALESCE(SUM(c.commission_amount), 0) - COALESCE(SUM(w.withdrawal_amount), 0)`,
        '>',
        0
      )

    const totalRecords = await getTotalRecordsSub(baseQuery);

    if (paginate) {
      baseQuery = baseQuery.$call((qb: any) => applyPagination(qb, q));
    }

    const data = await baseQuery.execute();

    const meta = generateMeta(q, totalRecords);

    return { data, meta };
  },

  async getInactiveMembers(q: QueryParams, paginate: boolean = false) {
    const { startOfMonth, endOfMonth } = getSixMonthsAgo();

    let baseQuery = db
      .selectFrom('account as a')
      .select([
        'a.account_id',
        sql<string>`CONCAT(a.account_first_name, ' ', a.account_last_name)`.as('name'),
        'a.account_email',
        'a.account_contact_number',
        'a.account_image',
      ])
      .where('a.account_role', '=', Role.DISTRIBUTOR)
      .where(
        // @ts-ignore
        sql`NOT EXISTS (
      SELECT 1
      FROM "order" o
      WHERE o.account_id = a.account_id
      AND o.created_at >= ${startOfMonth}
      AND o.created_at <= ${endOfMonth})`
      )
      .$call((eb: any) => applySearch(eb, q, 'a', ['account_first_name', 'account_last_name']))

    const totalRecords = await getTotalRecords(baseQuery);

    if (paginate) {
      baseQuery = baseQuery.$call((qb: any) => applyPagination(qb, q))
    }

    const data = await baseQuery.execute();

    const meta = generateMeta(q, totalRecords);

    return { data, meta }
  },

  async getProductStockHistory(q: QueryParams, paginate: boolean = false) {
    let baseQuery = db.selectFrom('product as p')
      .leftJoin('product_stock_history as psh', 'psh.product_id', 'p.product_id')
      .innerJoin('account as a', 'psh.account_id', 'a.account_id')
      .select([
        'psh.product_stock_history_id',
        'p.product_id',
        'p.product_name',
        'p.product_image',
        'psh.type',
        'a.account_first_name',
        'a.account_last_name',
        'a.account_role',
        'psh.quantity_change',
        'p.product_stock',
        'psh.current_stock',
        'psh.created_at',
        'psh.updated_at',
      ])
      .$call((eb: any) => applySearch(eb, q, 'p', ['product_name']))
      .$call((qb: any) => filterByDateRange(qb, q, 'psh'))

    const totalRecords = await getTotalRecords(baseQuery);

    if (paginate) {
      baseQuery = baseQuery.$call((qb: any) => applyPagination(qb, q))
    }

    const data = await baseQuery.orderBy('psh.created_at', 'desc').execute();

    const meta = generateMeta(q, totalRecords);

    return { data, meta }
  }
};
