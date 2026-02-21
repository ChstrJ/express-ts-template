import { Commission } from '@common/constants/commission';
import { Sales } from '@common/constants/sales';
import { Status } from '@common/constants/status';
import { getCurrentMonthRange } from '@utils/date';
import { filterByDateRange } from '@utils/filters';
import { IdGenerator } from '@utils/id-generator';
import { applyPagination, generateMeta, getTotalRecords, getTotalRecordsDistinct, getTotalRecordsSub, pagination, QueryParams } from '@utils/pagination';
import { applySearch } from '@utils/search';
import { sql } from 'kysely';
import db from 'src/db/db-client';

export const salesService = {
  async saveSales(accountId: string, salesAmount: number | any, salesType: string) {
    const data = {
      sales_id: IdGenerator.generateUUID(),
      account_id: accountId,
      sales_type: salesType,
      sales_amount: salesAmount,
      created_at: new Date(),
      updated_at: new Date()
    };

    await db.insertInto('sales').values(data).execute();

    return true;
  },

  async totalSales() {
    const { startOfMonth, endOfMonth } = getCurrentMonthRange();
    const result = await db
      .selectFrom('sales as s')
      .select(() => [
        sql<number>`SUM(CASE WHEN s.sales_type = ${Commission.TYPE_PACKAGE} THEN s.sales_amount ELSE 0 END)`.as('total_package_sales'),
        sql<number>`SUM(CASE WHEN s.sales_type = ${Commission.TYPE_PRODUCT} THEN s.sales_amount ELSE 0 END)`.as('total_product_sales'),
        sql<number>`SUM(CASE WHEN s.sales_type = ${Commission.TYPE_PRODUCT}
          AND s.created_at 
         BETWEEN ${startOfMonth} AND ${endOfMonth} THEN s.sales_amount ELSE 0 END)`.as('total_product_monthly_sales'),
        sql<number>`SUM(CASE WHEN s.sales_type = ${Commission.TYPE_PACKAGE}
         AND s.created_at 
         BETWEEN ${startOfMonth} AND ${endOfMonth} THEN s.sales_amount ELSE 0 END)`.as('total_package_monthly_sales')
      ])
      .executeTakeFirst();

    const packageSales = +(result?.total_package_sales ?? 0);
    const monthlyPackageSales = +(result?.total_package_monthly_sales ?? 0);
    const productSales = +(result?.total_product_sales ?? 0);
    const monthlyProductSales = +(result?.total_product_monthly_sales ?? 0);
    const grandTotalSales = packageSales + productSales;

    return {
      grandTotalSales,
      packageSales,
      productSales,
      monthlyProductSales,
      monthlyPackageSales
    };
  },

  async listSales(q: QueryParams) {
    const baseQuery = db.selectFrom('sales as s').leftJoin('account as a', 's.account_id', 'a.account_id');

    const totalRecords = await getTotalRecords(baseQuery);

    const data = baseQuery
      .select([
        's.sales_id',
        'a.account_id',
        sql`CONCAT(a.account_first_name, ' ', a.account_last_name)`.as('account_name'),
        's.sales_type',
        's.sales_amount',
        's.created_at',
        's.updated_at'
      ])
      .$call((eb) => applyPagination(eb, q))
      .orderBy('s.created_at', 'desc');

    const results = await data.execute();

    const meta = generateMeta(q, totalRecords);

    return { results, meta };
  },

  async getSalesForExport() {
    const results = await db
      .selectFrom('sales as s')
      .leftJoin('account as a', 's.account_id', 'a.account_id')
      .select(['s.sales_id', sql`CONCAT(a.account_first_name, ' ', a.account_last_name)`.as('account_name'), 's.sales_type', 's.sales_amount', 's.created_at', 's.updated_at'])
      .execute();

    return results;
  },

  async getOrderSalesReport(q: QueryParams) {
    const rows = await db
      .selectFrom('order as o')
      .leftJoin('order_item as oi', 'o.order_id', 'oi.order_id')
      .leftJoin('product as p', 'oi.product_id', 'p.product_id')
      .select([
        'oi.product_id',
        'p.product_name',
        sql<number>`SUM(oi.quantity)`.as('total_sold'),
        sql<number>`SUM(oi.quantity * oi.price)`.as('total_amount'),
      ])
      .groupBy([
        'oi.product_id',
        'p.product_name',
      ])
      .where('o.order_status', '=', Status.COMPLETED)
      .$call((qb) => filterByDateRange(qb, q, 'o'))
      .execute();

    return rows;
  },

  async getPackageSalesReport(q: QueryParams) {
    const data = await db
      .selectFrom('product_package as pp')
      .innerJoin('account_product_package as app', 'pp.product_package_id', 'app.product_package_id')
      .select([
        'pp.product_package_id',
        'pp.product_package_name as package_name',
        'app.product_package_price as price',
        sql<number>`COUNT(app.account_id)`.as('quantity'),
        sql<number>`ROUND(app.product_package_price * COUNT(app.account_id), 2)`.as('total_amount'),
        'app.created_at as date'
      ])
      .$call((qb) => filterByDateRange(qb, q, 'app'))
      .groupBy(['pp.product_package_id', 'pp.product_package_name', 'app.product_package_price', 'app.created_at'])
      .execute();

    return data;
  },

  async listProductSales(q: QueryParams) {
    const baseQuery = db
      .selectFrom('order as o')
      .leftJoin('account as a', 'o.account_id', 'a.account_id')
      .leftJoin('order_item as oi', 'oi.order_id', 'o.order_id')
      .leftJoin('product as p', 'oi.product_id', 'p.product_id')
      .select([
        'oi.order_item_id',
        'oi.product_id',
        sql`CONCAT(a.account_first_name, ' ', a.account_last_name)`.as('sold_to'),
        'p.product_name',
        'oi.quantity',
        'oi.price',
        sql`ROUND(oi.quantity * oi.price, 2)`.as('total_amount'),
        'o.created_at'
      ])
      .where('o.order_status', '=', Status.COMPLETED)
      .$call((eb) => applyPagination(eb, q))
      .$call((eb: any) => applySearch(eb, q, 'p', ['product_name']))
      .$call((eb: any) => filterByDateRange(eb, q, 'o'))

    const totalRecords = await getTotalRecordsSub(baseQuery);

    const data = await baseQuery.execute();

    const meta = generateMeta(q, totalRecords);

    return { data, meta };
  },

  async listPackageSales(q: QueryParams) {
    const baseQuery = db
      .selectFrom('product_package as pp')
      .innerJoin('account_product_package as app', 'pp.product_package_id', 'app.product_package_id')
      .innerJoin('account as a', 'app.account_id', 'a.account_id');

    const subquery = baseQuery
      .select([
        'pp.product_package_id',
        'pp.product_package_name',
        'app.product_package_price',
        sql`COUNT(app.account_id)`.as('quantity'),
        sql`ROUND(app.product_package_price * COUNT(app.account_id), 2)`.as('total_amount'),
        sql`DATE(app.created_at)`.as('date')
      ])
      .$call((eb) => applyPagination(eb, q))
      .$call((eb: any) => filterByDateRange(eb, q, 'app'))
      .$call((eb: any) => applySearch(eb, q, 'pp', ['product_package_name']))
      .groupBy([
        'pp.product_package_id',
        'app.product_package_price',
        sql`DATE(app.created_at)`
      ])

    const totalRecords = await db
      .selectFrom(subquery.as('g'))
      .select(({ fn }) => fn.countAll().as('count'))
      .executeTakeFirstOrThrow();

    const data = await subquery.execute();

    const meta = generateMeta(q, Number(totalRecords?.count));

    return { data, meta };
  },

  async getTotalSalesAmount(startDate: Date, endDate: Date, salesType: string = Sales.TYPE_PRODUCT) {
    const data = await db.selectFrom('sales')
      .select([
        sql<number>`SUM(sales_amount)`.as('total_sales'),
      ])
      .where('sales_type', '=', salesType)
      .where('created_at', '>=', startDate)
      .where('created_at', '<=', endDate)
      .executeTakeFirst();

    return data?.total_sales ?? 0;
  },

  async getTotalSalesAmountByAccount(accountId: string | string[], startDate: Date, endDate: Date, salesType: string = Sales.TYPE_PRODUCT) {
    const ids = Array.isArray(accountId) ? accountId : [accountId];

    const data = await db.selectFrom('sales')
      .select([
        sql<number>`SUM(sales_amount)`.as('total_sales'),
      ])
      .where('account_id', 'in', ids)
      .where('sales_type', '=', salesType)
      .where('created_at', '>=', startDate)
      .where('created_at', '<=', endDate)
      .executeTakeFirst();

    return data?.total_sales ?? 0;
  }
};
