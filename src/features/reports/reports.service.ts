import { QueryParams } from '@common/utils/pagination';
import { Account, Order, Product, Withdrawal } from 'src/db/generated/generated-types';
import { formatName, getImageUrl } from '@utils/helpers';
import { reportsRepository } from './reports.repository';
import { productsRepository } from '../products/products.repository';
import { IdGenerator } from '@utils/id-generator';
import { ProductSource, ProductType } from '@common/constants/product';
import dayjs from 'dayjs';

export const reportsService = {
  async getOrdersReport(q: QueryParams, paginate: boolean = false) {
    const { data, meta } = await reportsRepository.getAllOrders(q, paginate);

    const results = data.map((result: Order | any) => ({
      ...result,
      order_payment_image: getImageUrl(result.order_payment_image)
    }))

    return { data: results, meta }
  },

  async getUsersReport(q: QueryParams, paginate: boolean = false) {
    const { data: results, meta } = await reportsRepository.getAllUsers(q, paginate);

    const data = results.map((result: Account | any) => ({
      ...result,
      account_image: getImageUrl(result.account_image)
    }))

    return { data, meta };
  },

  async getProductsReport(q: QueryParams, paginate: boolean = false) {
    const { data, meta } = await productsRepository.getAllProducts(q, paginate);

    const records = data.map((result: Product | any) => ({
      ...result,
      product_image: getImageUrl(result.product_image)
    }))

    return { data: records, meta }
  },

  async getLowStockProductsReport(q: QueryParams, paginate: boolean = false) {
    const { data, meta } = await productsRepository.getLowStockProducts(q, paginate);

    const records = data.map((result: Product | any) => ({
      ...result,
      product_image: getImageUrl(result.product_image)
    }))

    return { data: records, meta }
  },

  async getCommissionsReport(q: QueryParams, paginate: boolean = false) {
    return await reportsRepository.getAllCommissions(q, paginate);
  },

  async getWithdrawalsReport(q: QueryParams, paginate: boolean = false) {
    const { data: results, meta } = await reportsRepository.getAllWithdrawals(q, paginate);

    const data = results.map((result: Withdrawal | any) => ({
      ...result,
      payment_method_qr_code: getImageUrl(result.payment_method_qr_code)
    }))

    return { data, meta };
  },

  getReports() {
    const records = reportsRepository.getAllReports();

    return records.map((record: any) => {
      return {
        id: IdGenerator.generateUUID(),
        ...record
      };
    });
  },

  getGenealogy(accountId: string, q: QueryParams, paginate: boolean = false) {
    return reportsRepository.listNetworkV2(accountId, 5, q, paginate);
  },

  getUnreleasedCommissions(q: QueryParams, paginate: boolean = false) {
    return reportsRepository.unreleasedCommission(q, paginate);
  },

  async getInactiveMembers(q: QueryParams, paginate: boolean = false) {
    const { data: records, meta } = await reportsRepository.getInactiveMembers(q, paginate);

    const data = records.map((record: any) => ({
      ...record,
      account_image: getImageUrl(record.account_image)
    }));

    return { data, meta }
  },

  async getProductStockHistory(q: QueryParams, paginate: boolean = false) {
    const { data: records, meta } = await reportsRepository.getProductStockHistory(q, paginate);

    const data = records.map(function(record: any) {
      return {
        product_stock_history_id: record.product_stock_history_id,
        product_id: record.product_id,
        product_name: record.product_name,
        type: record.type,
        account_name: formatName(record.account_first_name, record.account_last_name),
        account_role: record.account_role,
        product_image: getImageUrl(record.product_image),
        stock_in: record.type === ProductType.STOCK_IN ? record.quantity_change : 0,
        stock_out: record.type === ProductType.STOCK_OUT ? record.quantity_change : 0,
        running_balance: record.current_stock,
        created_at: dayjs(record.created_at).format("MM/DD/YYYY"),
      };
    });

    return { data, meta }
  }
};
