import { Status } from '@common/constants/status';
import { OrderItem, OrderItems, UpdateQuantity } from '@common/schema/orders';
import { BadRequestException, NotFoundException } from '@utils/errors';
import { IdGenerator } from '@utils/id-generator';
import db from 'src/db/db-client';
import { sql } from 'kysely';
import { Order, Product } from 'src/db/generated/generated-types';
import _ from 'lodash';
import { QueryParams } from '@utils/pagination';
import { orderRepository } from './order.repository';
import { generateAppLink, generateDateNow, generateOrderNumber, getImageUrl } from '@utils/helpers';
import { NotifCode } from '@common/constants/notifs-code';
import { AlertJob } from 'src/jobs/alert';
import { Role } from '@common/constants/roles';
import { EmailJob } from 'src/jobs/email';
import { EmailType } from '@common/constants/email';
import { accountService } from '@features/account/account.service';
import { productsRepository } from '@features/products/products.repository';

export const orderService = {
  async createOrder(data: OrderItems, accountId: string) {
    return await db.transaction().execute(async (trx) => {
      const formattedOrderItem = [];
      let formattedOrder = null;
      let totalAmount = 0;

      const account = await accountService.getAccountDetails(accountId);

      const requestProductIds = data.map((i) => i.product_id);
      const productMap = await this.fetchProductsAndMap(requestProductIds);

      const orderId = IdGenerator.generateUUID();

      for (const item of data) {
        await this.validateOrderItems(productMap, item);

        formattedOrderItem.push(this.prepareOrderItem(item, orderId));

        totalAmount += item.price * item.quantity;

        await trx
          .updateTable('product')
          .set({
            product_stock: sql`product_stock - ${item.quantity}`
          })
          .where('product_id', '=', item.product_id)
          .execute();
      }

      formattedOrder = this.prepareOrder(orderId, accountId, totalAmount);

      // Insert Order table
      await trx.insertInto('order').values(formattedOrder).execute();

      // Insert Order Item table
      await trx.insertInto('order_item').values(formattedOrderItem).execute();

      await trx.insertInto('order_payment').values(this.prepareOrderPayment(orderId)).execute();

      await AlertJob.addToQueue({
        role: Role.ADMIN_ROLES,
        code: NotifCode.NEW_ORDER,
        content: {
          link: 'pending-order'
        }
      });

      await AlertJob.addToQueue({
        code: NotifCode.ORDER_SENT,
        ids: accountId,
        content: {
          link: 'order-inventory'
        }
      });

      await EmailJob.addToQueue({
        type: EmailType.ORDER_PLACED_EMAIL,
        payload: {
          to: account.account_email,
          account_name: account.account_name,
          order_number: formattedOrder.order_number,
          link: generateAppLink('/order-inventory'),
        }
      })

      return true;
    });
  },

  async validateOrderItems(productMap: Map<string, Product> | any, item: OrderItem) {
    const product = productMap.get(item.product_id);

    if (!product) {
      throw new BadRequestException('Invalid Product ID.');
    }

    if (+item.price !== +product.product_price) {
      throw new BadRequestException('Invalid Price.');
    }

    if (+product.product_stock < item.quantity) {
      throw new BadRequestException('Invalid Quantity.');
    }
  },

  prepareOrderItem(item: OrderItem, orderId: string) {
    return {
      order_item_id: IdGenerator.generateUUID(),
      product_id: item.product_id,
      order_id: orderId,
      price: String(item.price),
      quantity: item.quantity,
      created_at: generateDateNow(),
      updated_at: generateDateNow()
    };
  },

  prepareOrder(orderId: string, accountId: string, totalAmount: number) {
    return {
      order_id: orderId,
      account_id: accountId,
      order_status: Status.PENDING,
      order_number: generateOrderNumber(),
      total_amount: String(totalAmount),
      created_at: generateDateNow(),
      updated_at: generateDateNow()
    };
  },

  async fetchProductsAndMap(requestProductIds: string[]) {
    const map = new Map<string, any>();

    const products = await productsRepository.fetchProductsForOrders(requestProductIds);

    for (const product of products) {
      map.set(product.product_id, product);
    }

    return map;
  },

  async listOrders(q: QueryParams) {
    const { results, meta } = await orderRepository.getAllOrders(q);

    const data = results.map((result: Order | any) => ({
      ...result,
      order_payment_image: getImageUrl(result.order_payment_image),
      order_pickup_image: getImageUrl(result.order_pickup_image)
    }))

    return { data, meta };
  },

  async listDistributorOrders(accountId: string, q: QueryParams) {
    const { data, meta } = await orderRepository.listOrderDistributors(accountId, q);

    const records = data.map((record: any) => ({
      ...record,
      order_payment_image: getImageUrl(record.order_payment_image),
      order_pickup_image: getImageUrl(record.order_pickup_image)
    }));

    return { data: records, meta };
  },

  async deleteOrder(orderId: string) {
    await this.checkOrderExists(orderId);

    await db.deleteFrom('order_item').where('order_id', '=', orderId).execute();

    await db.deleteFrom('order').where('order_id', '=', orderId).execute();

    return true;
  },

  async checkOrderExists(orderId: string) {
    const product = await db
      .selectFrom('order')
      .select(['order_id'])
      .where('order_id', '=', orderId)
      .executeTakeFirst();

    if (_.isEmpty(product)) {
      throw new NotFoundException('Order not found.');
    }
  },

  async listOrderItems(orderId: string) {
    const results = await orderRepository.listOrderItems(orderId);

    const formattedOrder = results.map((result) => {
      return {
        order_id: result.order_id,
        order_item_id: result.order_item_id,
        product_id: result.product_id,
        product_name: result.product_name,
        product_image: getImageUrl(result.product_image),
        quantity: result.quantity,
        price: result.price,
        created_at: result.created_at,
        updated_at: result.updated_at
      };
    });

    return formattedOrder;
  },

  async updateQuantity(itemId: string, data: UpdateQuantity) {
    const isIncrease = data.increase !== undefined;
    const isDecrease = data.decrease !== undefined;
    let updatedOrderAmount: number | null = null;
    let updatedQuantity = 0;

    if (isIncrease && isDecrease) {
      throw new BadRequestException('Cannot increase and decrease quantity at the same time.');
    }

    const orderItem = await db
      .selectFrom('order_item as oi')
      .leftJoin('order as o', 'o.order_id', 'oi.order_id')
      .select([
        'oi.order_item_id',
        'o.order_id',
        'o.account_id',
        'oi.product_id',
        'oi.quantity',
        'oi.price',
        'o.total_amount',
      ])
      .where('order_item_id', '=', itemId)
      .executeTakeFirstOrThrow(() => new NotFoundException('Order item not found'));

    const currentQuantity = orderItem.quantity ?? 0;
    const orderItemPrice = Number(orderItem.price) ?? 0;
    const currentOrderItemAmount = currentQuantity * orderItemPrice;

    const totalAmount = orderItem.total_amount ?? 0;

    if (currentQuantity <= 1 && isDecrease) {
      throw new BadRequestException('Cannot decrease quantity below 1.');
    }

    updatedQuantity = isIncrease ? currentQuantity + (data.increase ?? 0) : currentQuantity - (data.decrease ?? 0);

    const newTotalAmount = updatedQuantity * orderItemPrice;

    updatedOrderAmount = Number(totalAmount) - currentOrderItemAmount + newTotalAmount;

    await db.transaction().execute(async (trx) => {
      trx
        .updateTable('order')
        .set({
          total_amount: String(updatedOrderAmount)
        })
        .where('order_id', '=', orderItem.order_id)
        .execute();

      trx
        .updateTable('order_item')
        .set({
          quantity: updatedQuantity
        })
        .where('order_item_id', '=', itemId)
        .execute();

      trx
        .updateTable('product')
        .set({
          product_stock: sql`product_stock + ${data.increase}`
        })
        .where('product_id', '=', orderItem.product_id)
        .execute();
    });

    await AlertJob.addToQueue({
      code: NotifCode.ORDER_QUANTITY_UPDATE,
      ids: orderItem.account_id,
      content: {
        link: 'order-inventory'
      }
    });

    return true;
  },

  prepareOrderPayment(orderId: string) {
    return {
      order_payment_id: IdGenerator.generateUUID(),
      order_id: orderId,
      payment_method_id: null,
      order_payment_status: Status.PENDING,
      created_at: generateDateNow(),
      updated_at: generateDateNow()
    };
  },

  async getOrderById(orderId: string) {
    return await db
      .selectFrom('order as o')
      .innerJoin('order_payment as op', 'o.order_id', 'op.order_id')
      .select([
        'o.order_id',
        'o.order_number',
        'o.account_id',
        'o.order_status',
        'op.order_payment_image',
        'op.order_payment_status',
        'o.total_amount',
      ])
      .where('o.order_id', '=', orderId)
      .executeTakeFirstOrThrow(() => new NotFoundException('Order not found.'));
  },

  async getOrderItemsPV(orderId: string) {
    const records = await db
      .selectFrom('order_item as oi')
      .innerJoin('product as p', 'oi.product_id', 'p.product_id')
      .select(['p.product_pv', 'oi.quantity'])
      .where('oi.order_id', '=', orderId)
      .execute();

    return records.reduce((acc, record) => acc + +(record.product_pv ?? 0) * +(record.quantity ?? 0), 0);
  },
};
