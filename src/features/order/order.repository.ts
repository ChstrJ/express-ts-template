import { Role } from '@common/constants/roles';
import { applyRoleListing, filterByOrderPaymentStatus, filterByOrderStatus } from '@utils/filters';
import { applyPagination, generateMeta, getTotalRecords, getTotalRecordsDistinct, QueryParams } from '@utils/pagination';
import { applySearch } from '@utils/search';
import { sql } from 'kysely';
import db from 'src/db/db-client';

export const orderRepository = {
  async getAllOrders(q: QueryParams) {
    let baseQuery = db
      .selectFrom('order as o')
      .leftJoin('order_payment as op', 'o.order_id', 'op.order_id')
      .leftJoin('order_pickup as pup', 'o.order_id', 'pup.order_id')
      .leftJoin('payment_method as pm', 'op.payment_method_id', 'pm.payment_method_id')
      .leftJoin('account as a', 'o.account_id', 'a.account_id')
      .where('a.account_role', '=', Role.DISTRIBUTOR)
      .$call((qb: any) => applySearch(qb, q, 'o', ['order_number']))
      .$call((qb: any) => filterByOrderStatus(qb, q, 'o'))
      .$call((qb: any) => filterByOrderPaymentStatus(qb, q, 'op'));

    const totalRecords = await getTotalRecords(baseQuery);

    let subquery = baseQuery
      .select([
        'o.order_id',
        'a.account_id',
        'pm.payment_method_id',
        sql`CONCAT(a.account_first_name, ' ', a.account_last_name)`.as('ordered_by'),
        'a.account_contact_number',
        'op.order_payment_image',
        'pup.order_pickup_image',
        'op.order_payment_status',
        'pm.payment_method',
        'o.total_amount',
        'o.order_number',
        'o.order_status',
        'o.created_at',
        'o.updated_at'
      ])
      .$call((qb: any) => applyPagination(qb, q));

    const results = await subquery.orderBy('o.order_status', 'desc').execute();

    const meta = generateMeta(q, totalRecords);

    return { results, meta };
  },

  async listOrderDistributors(accountId: string, q: QueryParams) {
    const baseQuery = await db
      .selectFrom('order as o')
      .innerJoin('order_payment as op', 'o.order_id', 'op.order_id')
      .leftJoin('order_pickup as pup', 'o.order_id', 'pup.order_id')
      .where('account_id', '=', accountId)
      .select([
        'o.order_id',
        'op.order_payment_id',
        'op.order_payment_status',
        'op.order_payment_image',
        'pup.order_pickup_image',
        'o.total_amount',
        'o.order_number',
        'o.order_status',
        'o.created_at',
        'o.updated_at'
      ])
      .$call((eb) => applyPagination(eb, q))
      .$call((eb: any) => applySearch(eb, q, 'o', ['order_number']))
      .$call((eb: any) => filterByOrderStatus(eb, q, 'o'))

    const totalRecords = await getTotalRecords(baseQuery);

    const data = await baseQuery
      .orderBy('o.created_at', 'desc')
      .execute();

    const meta = generateMeta(q, totalRecords);

    return { data, meta };
  },

  async listOrderItems(orderId: string) {
    return await db
      .selectFrom('order as o')
      .leftJoin('order_item as oi', 'oi.order_id', 'o.order_id')
      .leftJoin('product as p', 'oi.product_id', 'p.product_id')
      .select([
        'o.order_id',
        'oi.order_item_id',
        'p.product_id',
        'p.product_name',
        'p.product_image',
        'oi.quantity',
        'oi.price',
        'oi.created_at',
        'oi.updated_at'
      ])
      .where('o.order_id', '=', orderId)
      .execute();
  }
};
