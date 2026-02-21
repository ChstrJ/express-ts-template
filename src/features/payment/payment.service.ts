import { Log } from '@common/constants/log';
import { NotifCode } from '@common/constants/notifs-code';
import { Role } from '@common/constants/roles';
import { Status } from '@common/constants/status';
import { createPaymentMethodType, updateOrderPayment, updatePaymentMethodType } from '@common/schema/payment';
import { orderService } from '@features/order/order.service';
import { deleteFile, uploadFile } from '@lib/r2';
import { BadRequestException, NotFoundException } from '@utils/errors';
import { generateDateNow, generatePaymentKey, generatePaymentMethodKey, getAccountName, getImageUrl, logActivity } from '@utils/helpers';
import { IdGenerator } from '@utils/id-generator';
import logger from '@utils/logger';
import _ from 'lodash';
import db from 'src/db/db-client';
import { PaymentMethod } from 'src/db/generated/generated-types';
import { AlertJob } from 'src/jobs/alert';

export const paymentService = {
  formatPaymentMethod(paymentMethod: PaymentMethod[] | any) {
    return paymentMethod.map((data: PaymentMethod) => {
      return {
        payment_method_id: data.payment_method_id,
        payment_method: data.payment_method.toLocaleUpperCase(),
        payment_method_name: data.payment_method_name,
        payment_method_number: data.payment_method_number,
        payment_method_qr_code: getImageUrl(data.payment_method_qr_code),
        payment_method_status: data.payment_method_status,
        payment_method_type: data.payment_method_type?.toLocaleUpperCase(),
        created_at: data.created_at,
        updated_at: data.updated_at
      };
    });
  },

  async getAllPaymentMethods() {
    const data = await db.selectFrom('payment_method').selectAll().execute();

    return this.formatPaymentMethod(data);
  },

  async findPaymentMethod(id: string) {
    return await db
      .selectFrom('payment_method')
      .select(['payment_method_id', 'payment_method', 'payment_method_name', 'payment_method_number', 'payment_method_qr_code', 'payment_method_status', 'payment_method_type'])
      .where('payment_method_id', '=', id)
      .executeTakeFirstOrThrow(() => new NotFoundException('Payment method not found'));
  },

  async createPaymentMethod(adminId: string, data: createPaymentMethodType, file: Express.Multer.File) {
    const insertData = {
      payment_method_id: IdGenerator.generateUUID(),
      payment_method: data.method,
      payment_method_name: data.name,
      payment_method_number: data.number,
      payment_method_type: data.type,
      payment_method_status: data.status ?? Status.ACTIVE,
      created_at: generateDateNow(),
      updated_at: generateDateNow()
    };

    try {
      if (file) {
        const image = await uploadFile(generatePaymentMethodKey(), file);

        _.assign(insertData, { payment_method_qr_code: image?.file_key });
      }

      await db.insertInto('payment_method').values(insertData).execute();

      await logActivity({
        accountId: adminId,
        action: Log.ACTION_CREATE,
        message: `Payment method ${insertData.payment_method_name} has been created`,
        type: Log.TYPE_PAYMENT_METHOD,
        typeId: insertData.payment_method_id,
      });
    } catch (err) {
      logger.error(err);
      throw new BadRequestException('Error creating payment method');
    }

    return true;
  },

  async updatePaymentMethod(adminId: string, id: string, data: updatePaymentMethodType, file: Express.Multer.File) {
    const paymentMethod = await this.findPaymentMethod(id);

    const updateData = {
      payment_method: data?.method,
      payment_method_name: data?.name,
      payment_method_number: data?.number,
      payment_method_qr_code: data?.image,
      payment_method_type: data?.type,
      payment_method_status: data?.status,
      updated_at: generateDateNow()
    };

    try {
      if (file) {
        await deleteFile(paymentMethod.payment_method_qr_code);
        const image = await uploadFile(generatePaymentMethodKey(), file);

        _.assign(updateData, { payment_method_qr_code: image?.file_key });
      }
      await db.updateTable('payment_method').set(updateData).where('payment_method_id', '=', id).execute();

      await logActivity({
        accountId: adminId,
        action: Log.ACTION_UPDATE,
        message: `Payment method ${paymentMethod.payment_method_name} has been updated`,
        type: Log.TYPE_PAYMENT_METHOD,
        typeId: paymentMethod.payment_method_id,
      });
    } catch (err) {
      logger.error(err);

      throw new BadRequestException('Error updating payment method');
    }

    return true;
  },

  async deletePaymentMethod(adminId: string, id: string) {
    const paymentMethod = await this.findPaymentMethod(id);

    if (paymentMethod.payment_method_qr_code) {
      await deleteFile(paymentMethod.payment_method_qr_code ?? '');
    }

    await logActivity({
      accountId: adminId,
      action: Log.ACTION_DELETE,
      message: `Payment method ${paymentMethod.payment_method_name} has been deleted`,
      type: Log.TYPE_PAYMENT_METHOD,
      typeId: paymentMethod.payment_method_id,
    });

    try {
      await db.deleteFrom('payment_method').where('payment_method_id', '=', id).execute();
    } catch (err) {
      logger.error(err);
      throw new BadRequestException('Error deleting payment method');
    }
  },

  async sendPayment(orderId: string, data: Partial<updateOrderPayment>, file: Express.Multer.File) {
    const order = await orderService.getOrderById(orderId);

    if (order.order_status === Status.REJECTED) {
      throw new BadRequestException('This order has been rejected and cannot be paid.');
    }

    const updateData = {
      payment_method_id: data.method_id,
      order_payment_status: Status.VERIFYING,
      updated_at: generateDateNow()
    };

    try {
      if (order.order_payment_image) {
        await deleteFile(order.order_payment_image);
      }

      if (file) {
        const image = await uploadFile(generatePaymentKey(), file);

        _.assign(updateData, { order_payment_image: image?.file_key });
      }

      await db.updateTable('order_payment')
        .set(updateData)
        .where('order_id', '=', orderId)
        .execute();

      await db.updateTable('order')
        .set({ order_status: Status.VERIFYING })
        .where('order_id', '=', orderId)
        .execute();

      const accountName = await getAccountName(order.account_id);

      await AlertJob.addToQueue({
        role: Role.ADMIN_ROLES,
        code: NotifCode.PAYMENT_RECEIVED,
        content: {
          link: 'pending-orders',
          order_id: orderId,
          name: accountName
        }
      });

      await AlertJob.addToQueue({
        code: NotifCode.PAYMENT_SENT,
        ids: order.account_id,
        content: {
          link: 'order-inventory',
          order_id: orderId
        }
      });
    } catch (err) {
      logger.error(err);
      throw new BadRequestException('Payment not sent.');
    }

    return true;
  },

  async getAllOrderPayment() {
    return await db
      .selectFrom('order_payment as op')
      .innerJoin('order as o', 'op.order_id', 'o.order_id')
      .innerJoin('account as a', 'o.account_id', 'a.account_id')
      .innerJoin('payment_method as pm', 'op.payment_method_id', 'pm.payment_method_id')
      .select([
        'op.order_payment_id',
        'pm.payment_method_id',
        'op.order_payment_status',
        'op.order_payment_image',
        'op.created_at',
        'op.updated_at',
        'o.order_id',
        'o.total_amount',
        'o.order_status',
        'pm.payment_method'
      ])
      .where('a.account_role', '=', Role.DISTRIBUTOR)
      .execute();
  },

  async getPayment(orderId: string) {
    const results = await db
      .selectFrom('order_payment as op')
      .leftJoin('order as o', 'op.order_id', 'o.order_id')
      .leftJoin('payment_method as pm', 'op.payment_method_id', 'pm.payment_method_id')
      .innerJoin('account as a', 'o.account_id', 'a.account_id')
      .select([
        'o.order_id',
        'o.total_amount',
        'o.order_status',
        'pm.payment_method_id',
        'pm.payment_method',
        'pm.payment_method_qr_code',
        'payment_method_name',
        'payment_method_number',
        'op.order_payment_id',
        'op.payment_method_id',
        'op.order_payment_status',
        'op.order_payment_image',
        'op.created_at',
        'op.updated_at'
      ])
      .where('o.order_id', '=', orderId)
      .executeTakeFirstOrThrow(() => new NotFoundException('Payment not found'));

    return {
      ...results,
      payment_method_qr_code: getImageUrl(results.payment_method_qr_code),
      order_payment_image: getImageUrl(results.order_payment_image)
    };
  }
};
