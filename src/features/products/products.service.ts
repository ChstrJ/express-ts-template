import { productPackageRepository } from '@features/product-package/product-package.repository';
import { productsRepository } from '@features/products/products.repository';
import db from 'src/db/db-client';
import _ from 'lodash';
import { AlreadyExistsException, BadRequestException, NotFoundException } from '@utils/errors';
import logger from '@utils/logger';
import { IdGenerator } from '@utils/id-generator';
import { generateDateNow, generateProductImageKey, getAccountName, getImageUrl, logActivity } from '@utils/helpers';
import { deleteFile, uploadFile } from '@lib/r2';
import { QueryParams } from '@utils/pagination';
import { Product, ProductPackage } from 'src/db/generated/generated-types';
import { CreateProduct, UpdateProduct } from '@common/schema/products';
import { Status } from '@common/constants/status';
import { Log } from '@common/constants/log';
import { ProductSource, ProductType } from '@common/constants/product';
import { sql } from 'kysely';

export const productsService = {
  async getProductsPackage() {
    return await productPackageRepository.getAllProductsPackage();
  },

  async listProducts(productPackageId: string, queryParams: QueryParams) {
    const { data, meta } = await productsRepository.getProductsByPackageId(productPackageId, queryParams);

    let formattedData = data.map((product: Product | any) => {
      return {
        package_id: product.product_package_id,
        package_name: product.product_package_name,
        product_id: product.product_id,
        product_name: product.product_name,
        product_category: product.product_category,
        product_description: product.product_description,
        product_price: product.product_price,
        product_stock: product.product_stock,
        product_pv: product.product_pv,
        product_status: product.product_status,
        product_image: getImageUrl(product.product_image),
        threshold_qty: product.threshold_qty,
        created_at: product.created_at,
        updated_at: product.updated_at
      };
    });

    const productIds = formattedData.map((data: Product) => data.product_id);

    if (!_.isEmpty(productIds)) {
      const packages = await this.listPackagesUnderProduct(productIds, true);
      formattedData = formattedData.map((data: Product) => {
        return {
          ...data,
          package_ids: packages[data.product_id]
        };
      });
    }

    return { formattedData, meta };
  },

  async createProduct(adminId: string, productData: CreateProduct | any, file: Express.Multer.File) {
    let data = {
      product_id: IdGenerator.generateUUID(),
      product_name: productData.product_name,
      product_description: productData.product_description,
      product_price: productData.product_price,
      product_status: productData.product_status,
      product_pv: productData.product_pv,
      product_stock: productData.product_stock,
      product_category_id: productData.category_id,
      created_at: generateDateNow(),
      updated_at: generateDateNow()
    };

    const pivotData = productData.package_ids.map((packageId: string) => {
      return {
        product_package_product_id: IdGenerator.generateUUID(),
        product_id: data.product_id,
        product_package_id: packageId,
      };
    });

    try {
      if (file) {
        const image = await uploadFile(generateProductImageKey(), file);

        data = _.assign(data, { product_image: image?.file_key });
      }

      await db.insertInto('product').values(data).execute();
      await db.insertInto('product_package__product').values(pivotData).execute();

      const quantityChanged = Math.abs(productData.product_stock);

      await db.insertInto('product_stock_history').values(
        this.prepareStockHistory(
          data.product_id,
          quantityChanged,
          ProductType.STOCK_IN,
          productData.product_stock,
          adminId
        )
      ).execute();

      if (productData.threshold_qty) {
        const lowStockData = this.prepareLowStockTriggerData(data.product_id, productData.threshold_qty);

        await db.insertInto('product_low_stock').values(lowStockData).execute();
      }

      await logActivity({
        accountId: adminId,
        action: Log.ACTION_CREATE,
        message: `Product ${data.product_name} has been created`,
        type: Log.TYPE_PRODUCT,
        typeId: data.product_id,
      });
    } catch (err: any) {
      if (err.code === 'ER_DUP_ENTRY') {
        throw new AlreadyExistsException('Product name already exists');
      }
      logger.error('Error creating product: ', err);
      throw new BadRequestException('Error creating product');
    }

    return true;
  },

  async updateProduct(adminId: string, productId: string, productData: UpdateProduct | any, file: Express.Multer.File) {
    const products = await this.checkProductExists(productId);

    let data = {
      product_name: productData?.product_name,
      product_description: productData?.product_description,
      product_price: productData?.product_price,
      product_status: productData?.product_status,
      product_pv: productData?.product_pv,
      product_stock: productData?.product_stock,
      product_category_id: productData?.category_id,
      updated_at: generateDateNow()
    };

    if (productData.product_stock && productData.product_stock != products.product_stock) {
      const oldQty = products.product_stock;
      const newQty = productData.product_stock;
      const quantityChanged = newQty - oldQty;
      const resultingStock = Math.max(newQty, 0);

      await db.insertInto('product_stock_history').values(
        this.prepareStockHistory(
          productId,
          Math.abs(quantityChanged),
          quantityChanged >= 0 ? ProductType.STOCK_IN : ProductType.STOCK_OUT,
          resultingStock,
          adminId
        )
      ).execute();
    }

    if (productData.threshold_qty) {
      await db.updateTable('product_low_stock')
        .set({
          threshold_qty: Number(productData.threshold_qty),
          updated_at: generateDateNow()
        })
        .where('product_id', '=', productId)
        .execute();
    }

    try {
      if (!_.isEmpty(file)) {
        await deleteFile(products.product_image ?? '');
        const image = await uploadFile(generateProductImageKey(), file);

        data = _.assign(data, { product_image: image?.file_key });
      }

      // For selecting the checkbox
      if (productData.package_ids && Array.isArray(productData.package_ids)) {
        await this.prepareAndInsertProductPackage(productId, productData);
      }

      // For un-selecting the checkbox
      if (productData.d_package_ids && Array.isArray(productData.d_package_ids)) {
        await db.deleteFrom('product_package__product')
          .where('product_package_id', 'in', productData.d_package_ids)
          .where('product_id', '=', productId)
          .execute();
      }

      await db.updateTable('product').set(data).where('product_id', '=', productId).execute();

      await logActivity({
        accountId: adminId,
        action: Log.ACTION_UPDATE,
        message: `Product ${data.product_name} has been updated`,
        type: Log.TYPE_PRODUCT,
        typeId: productId,
      });
    } catch (err) {
      logger.error(err);
      throw new BadRequestException('Error updating the product.');
    }

    return true;
  },

  async deleteProduct(adminId: string, productId: string) {
    const product = await this.checkProductExists(productId);

    try {
      if (!_.isEmpty(product)) {
        await deleteFile(product.product_image);
      }

      await db
        .updateTable('product')
        .set({
          product_status: Status.DELETED
        })
        .where('product_id', '=', productId)
        .execute();

      await logActivity({
        accountId: adminId,
        action: Log.ACTION_DELETE,
        message: `Product ${product.product_name} has been deleted`,
        type: Log.TYPE_PRODUCT,
        typeId: productId,
      });
    } catch (err) {
      console.log(err);
      logger.info('Error deleting product', err);
      return false;
    }

    return true;
  },

  async checkProductExists(productId: string) {
    const product = await db.selectFrom('product')
      .select([
        'product_id',
        'product_image',
        'product_name',
        'product_stock',
        'product_category_id'
      ])
      .where('product_id', '=', productId)
      .executeTakeFirstOrThrow(() => new NotFoundException('Product not found.'));

    return product;
  },

  async getProducts(q: QueryParams, paginate: boolean = false) {
    const { data: records, meta } = await productsRepository.getAllProducts(q, paginate);

    const data = records.map((record: Product) => ({
      ...record,
      product_image: getImageUrl(record.product_image)
    }))

    return { data, meta };
  },

  async listPackagesUnderProduct(productId: string | string[], returnMap: boolean = false) {
    const ids = Array.isArray(productId) ? productId : [productId];

    const records = await db
      .selectFrom('product_package__product as p2p')
      .innerJoin('product_package as pp', 'p2p.product_package_id', 'pp.product_package_id')
      .select(['p2p.product_id', 'pp.product_package_id', 'pp.product_package_name'])
      .where('p2p.product_id', 'in', ids)
      .execute();

    if (!returnMap) {
      return records;
    }

    const data: any = {};

    for (const record of records) {
      const productId = record.product_id ?? 0;

      if (!data[productId]) {
        data[productId] = [];
      }

      data[productId].push({ ...record });
    }

    return data;
  },

  async prepareAndInsertProductPackage(productId: string, productData: Record<string, any>) {
    const packages = await this.listPackagesUnderProduct(productId);
    const ids = productData.package_ids;

    const data = [];

    const packageIds = packages.map((pkg: ProductPackage) => pkg.product_package_id);

    for (const id of ids) {
      if (packageIds.includes(id)) {
        continue;
      }

      data.push({
        product_package_product_id: IdGenerator.generateUUID(),
        product_id: productId,
        product_package_id: id,
      });
    }

    if (!_.isEmpty(data)) {
      await db.insertInto('product_package__product').values(data).execute();
    }
  },

  async getProductPVById(productId: string | string[]) {
    const product = await db.selectFrom('product').select(['product_id', 'product_pv']).where('product_id', 'in', productId).execute();

    const map = new Map();

    for (const item of product) {
      map.set(item.product_id, item.product_pv);
    }

    return map;
  },

  prepareStockHistory(productId: string, qty: number, type: string, currentStock: number, accountId: string | null = null) {
    return {
      product_stock_history_id: IdGenerator.generateUUID(),
      product_id: productId,
      account_id: accountId,
      quantity_change: qty,
      current_stock: currentStock,
      type: type,
      created_at: generateDateNow(),
      updated_at: generateDateNow()
    }
  },

  async getOrderQtyChangeAndInsert(orderId: string, accountId: string) {
    const records = await db
      .selectFrom('order_item as oi')
      .innerJoin('order as o', 'oi.order_id', 'o.order_id')
      .innerJoin('product as p', 'oi.product_id', 'p.product_id')
      .select([
        'p.product_id',
        'oi.quantity',
        'o.order_number',
        'p.product_stock'
      ])
      .where('oi.order_id', '=', orderId)
      .execute();

    if (_.isEmpty(records)) {
      return;
    }

    const formattedStockHistoryData = [];
    for (const record of records) {
      const qty = Math.abs(Number(record.quantity));

      formattedStockHistoryData.push(
        this.prepareStockHistory(
          record.product_id,
          qty,
          ProductType.STOCK_OUT,
          record.product_stock,
          accountId
        )
      )
    }

    await db.insertInto('product_stock_history').values(formattedStockHistoryData).execute();
  },

  async updateProductStock(adminId: string, productId: string, stock: number) {
    await this.checkProductExists(productId);

    await db.updateTable('product')
      .set({
        'product_stock': sql`product_stock + ${stock}`
      })
      .where('product_id', '=', productId).execute();

    const product = await db.selectFrom('product')
      .select([
        'product_stock'
      ])
      .where('product_id', '=', productId)
      .executeTakeFirst();

    await db.insertInto('product_stock_history')
      .values(
        this.prepareStockHistory(
          productId,
          stock,
          ProductType.STOCK_IN,
          product?.product_stock ?? 0,
          adminId
        )
      )
      .execute();

    return true;
  },

  prepareLowStockTriggerData(productId: string, threshold: number) {
    return {
      product_low_stock_id: IdGenerator.generateUUID(),
      product_id: productId,
      threshold_qty: threshold,
      created_at: generateDateNow(),
      updated_at: generateDateNow()
    }
  },

  async hasLowStockProducts() {
    const data = await db
      .selectFrom('product as p')
      .leftJoin('product_low_stock as pls', 'p.product_id', 'pls.product_id')
      .select([
        'p.product_id',
        'p.product_stock',
        'pls.threshold_qty'
      ])
      .where('p.product_status', '!=', Status.DELETED)
      .where(() =>
        sql<boolean>`p.product_stock <= COALESCE(pls.threshold_qty)`
      )
      .executeTakeFirst();

    return !_.isEmpty(data);
  }
};
