import { Settings } from '@common/constants/settings';
import { Status } from '@common/constants/status';
import { filterByPackage } from '@utils/filters';
import { findAppSettings } from '@utils/helpers';
import { applyPagination, generateMeta, getTotalRecords, QueryParams } from '@utils/pagination';
import { applySearch } from '@utils/search';
import { ExpressionBuilder, sql } from 'kysely';
import db from 'src/db/db-client';

export const productsRepository = {
  async getProductsByPackageId(productPackageId: string, q: QueryParams) {
    const baseQuery = db
      .selectFrom('product_package as pp')
      .innerJoin('product_package__product as p2p', 'pp.product_package_id', 'p2p.product_package_id')
      .innerJoin('product as p', 'p2p.product_id', 'p.product_id')
      .leftJoin('product_category as pc', 'p.product_category_id', 'pc.product_category_id')
      .leftJoin('product_low_stock as pls', 'p.product_id', 'pls.product_id')
      .where('p.product_status', '=', Status.ACTIVE)
      .where('pp.product_package_id', '=', productPackageId);

    const totalRecords = await getTotalRecords(baseQuery);

    const data = await baseQuery
      .select([
        'pp.product_package_id',
        'pp.product_package_name',
        'p.product_id',
        'p.product_name',
        'pc.product_category',
        'pc.product_category_id',
        'p.product_description',
        'p.product_price',
        'p.product_stock',
        'p.product_pv',
        'p.product_status',
        'p.product_image',
        'pls.threshold_qty',
        'p.created_at',
        'p.updated_at'
      ])
      .$call((eb) => applyPagination(eb, q))
      .$call((eb: ExpressionBuilder<any, any>) => applySearch(eb, q, 'p', ['product_name']))
      .orderBy('p.created_at', 'desc')
      .execute();

    const meta = generateMeta(q, totalRecords);

    return { data, meta };
  },

  async getAllProducts(q: QueryParams, paginate: boolean = false) {
    const baseQuery = db
      .selectFrom('product as p')
      .innerJoin('product_category as pc', 'p.product_category_id', 'pc.product_category_id')

    const totalRecords = await getTotalRecords(baseQuery);

    let query = baseQuery
      .select([
        'p.product_id',
        'p.product_name',
        'p.product_description',
        'p.product_price',
        'p.product_stock',
        'pc.product_category',
        'p.product_pv',
        'p.product_status',
        'p.product_image',
        'p.created_at',
        'p.updated_at'
      ])
      .$call((qb) => filterByPackage(qb, q))
      .$call((qb: any) => applySearch(qb, q, 'p', ['product_name']))

    if (paginate) {
      query = query.$call((qb: any) => applyPagination(qb, q));
    }

    const data = await query.execute();
    const meta = paginate ? generateMeta(q, totalRecords) : { totalRecords };

    return { data, meta };
  },

  async getLowStockProducts(q: QueryParams, paginate: boolean = false) {
    const lowStockThreshold = await findAppSettings(Settings.LOW_STOCK_THRESHOLD) ?? 10;

    const baseQuery = db
      .selectFrom('product as p')
      .innerJoin('product_category as pc', 'p.product_category_id', 'pc.product_category_id')
      .leftJoin('product_package__product as p2p', 'p.product_id', 'p2p.product_id')
      .leftJoin('product_package as pp', 'p2p.product_package_id', 'pp.product_package_id')
      .leftJoin('product_low_stock as pls', 'p.product_id', 'pls.product_id');

    const totalRecords = await getTotalRecords(baseQuery);

    let query = baseQuery
      .select([
        'pp.product_package_id',
        'pp.product_package_name',
        'p.product_name',
        'p.product_description',
        'p.product_price',
        'p.product_stock',
        'pc.product_category',
        'p.product_pv',
        'p.product_status',
        'p.product_image',
        'p.created_at',
        'p.updated_at',
        'pls.threshold_qty'
      ])
      .where(() =>
        sql<boolean>`p.product_stock <= COALESCE(pls.threshold_qty, ${lowStockThreshold})`
      )
      .$call((qb) => filterByPackage(qb, q))
      .$call((qb: any) => applySearch(qb, q, 'p', ['product_name']));

    if (paginate) {
      query = query.$call((qb: any) => applyPagination(qb, q));
    }

    const data = await query.execute();
    const meta = paginate ? generateMeta(q, totalRecords) : { totalRecords };

    return { data, meta };
  },

  async fetchProductsForOrders(productIds: string[]) {
    return await db
      .selectFrom('product')
      .select(['product_id', 'product_price', 'product_pv', 'product_stock'])
      .where('product_id', 'in', productIds)
      .execute();
  }
};
