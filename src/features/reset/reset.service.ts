import { Role } from '@common/constants/roles';
import { DB } from 'src/db/generated/generated-types';
import db from 'src/db/db-client';
import { Transaction } from 'kysely';
import _ from 'lodash';

export const resetService = {
  async resetSales() {
    const msg = { message: 'Sales reset completed' };

    await db.transaction().execute(async (trx) => {
      const ids = await this.getAccountIds(trx);

      if (!ids) {
        return msg;
      }

      await trx.deleteFrom('sales').where('account_id', 'in', ids).execute();
    })

    return msg;
  },

  async resetProducts() {
    const msg = { message: 'Products reset completed' }

    await db.transaction().execute(async (trx) => {
      const products = await trx.selectFrom('product').select(['product_id']).execute();

      if (!products) {
        return msg;
      }

      const productIds = products.map(product => product.product_id);

      const orderItems = await trx.selectFrom('order_item')
        .select(['order_id'])
        .where('product_id', 'in', productIds)
        .execute();

      if (!orderItems) {
        return msg;
      }

      const orderIds = orderItems.map(item => item.order_id);

      await trx.deleteFrom('order_item').where('product_id', 'in', productIds).execute();
      await trx.deleteFrom('order_payment').where('order_id', 'in', orderIds).execute();
      await trx.deleteFrom('order_pickup').where('order_id', 'in', orderIds).execute();
      await trx.deleteFrom('order').where('order_id', 'in', orderIds).execute();
      await trx.deleteFrom('product_package__product').execute();
      await trx.deleteFrom('product_stock_history').where('product_id', 'in', productIds).execute();
      await trx.deleteFrom('product_low_stock').where('product_id', 'in', productIds).execute();
      await trx.deleteFrom('product').where('product_id', 'in', productIds).execute();
    })

    return msg;
  },

  async resetCommission() {
    const msg = { message: 'Commission reset completed' }

    await db.transaction().execute(async (trx) => {
      const ids = await this.getAccountIds(trx);

      if (!ids) {
        return msg;
      }

      await trx.deleteFrom('commission').where('account_id', 'in', ids).execute();
    })

    return msg;
  },

  async getAccountIds(trx?: Transaction<DB>) {
    const dbClient = trx || db;
    const accounts = await dbClient.selectFrom('account')
      .select(['account_id'])
      .where('account_role', 'not in', Role.ADMIN_ROLES)
      .execute();

    if (!accounts) {
      return [];
    }

    return accounts.map(account => account.account_id);
  },

  async masterReset() {
    await this.resetDistributors();
    await this.resetProductsV2();
    await this.resetChats();

    return { message: 'Master reset completed' };
  },

  async resetProductsV2() {
    const products = await db.selectFrom('product').select(['product_id']).execute();

    if (_.isEmpty(products)) {
      return;
    }

    const productIds = products.map(product => product.product_id);

    await db.deleteFrom('product_package__product').execute();
    await db.deleteFrom('product_stock_history').where('product_id', 'in', productIds).execute();
    await db.deleteFrom('product_package').execute();
    await db.deleteFrom('file').execute();
    await db.deleteFrom('product').where('product_id', 'in', productIds).execute();
  },

  async resetChats() {
    const chats = await db.selectFrom('chat').select(['chat_id']).execute();

    if (_.isEmpty(chats)) {
      return;
    }

    const chatIds = chats.map(chat => chat.chat_id);

    await db.deleteFrom('chat_participants').where('chat_id', 'in', chatIds).execute();
    await db.deleteFrom('chat_messages').where('chat_id', 'in', chatIds).execute();
    await db.deleteFrom('chat').execute();
  },

  async resetDistributors() {
    await db.transaction().execute(async (trx) => {
      const accountIds = await this.getAccountIds(trx);

      if (_.isEmpty(accountIds)) {
        return;
      }

      await trx.deleteFrom('account_tree_path')
        .where('ancestor_id', 'in', accountIds)
        .where('descendant_id', 'in', accountIds)
        .execute();

      await trx.deleteFrom('account_pv')
        .where('account_id', 'in', accountIds)
        .execute()

      await trx.deleteFrom('account_notification')
        .where('account_id', 'in', accountIds)
        .execute()

      await trx.deleteFrom('account_reason')
        .where('account_id', 'in', accountIds)
        .execute()

      await trx.deleteFrom('account_referral')
        .where('account_id', 'in', accountIds)
        .execute();

      await trx.deleteFrom('referral_code')
        .where('account_id', 'in', accountIds)
        .execute()

      await trx.deleteFrom('account_product_package')
        .where('account_id', 'in', accountIds)
        .execute()

      await trx.deleteFrom('chat_participants')
        .where('account_id', 'in', accountIds)
        .execute()

      await trx.deleteFrom('chat_messages')
        .where('sender_id', 'in', accountIds)
        .execute()

      await trx.deleteFrom('team')
        .where('team_leader_id', 'in', accountIds)
        .execute()

      await trx.deleteFrom('commission')
        .where('account_id', 'in', accountIds)
        .execute()

      const orders = await trx.selectFrom('order')
        .leftJoin('order_item', 'order.order_id', 'order_item.order_id')
        .leftJoin('account', 'order.account_id', 'account.account_id')
        .select(['order.order_id'])
        .where('account.account_id', 'in', accountIds)
        .execute();

      const orderIds = orders.map(order => order.order_id);

      await trx.deleteFrom('order_payment')
        .where('order_id', 'in', orderIds)
        .execute();

      await trx.deleteFrom('order_item')
        .where('order_id', 'in', orderIds)
        .execute();

      await trx.deleteFrom('order_pickup')
        .where('order_id', 'in', orderIds)
        .execute();

      await trx.deleteFrom('sales')
        .where('account_id', 'in', accountIds)
        .execute();

      await trx.deleteFrom('order')
        .where('order_id', 'in', orderIds)
        .execute();

      await trx.deleteFrom('refresh_token')
        .where('account_id', 'in', accountIds)
        .execute();

      // get wallet ids
      const wallets = await trx.selectFrom('wallet').where('account_id', 'in', accountIds).select(['wallet_id']).execute();
      const walletIds = wallets.map(wallet => wallet.wallet_id);

      await trx.deleteFrom('wallet_transaction')
        .where('wallet_id', 'in', walletIds)
        .execute()

      await trx.deleteFrom('wallet')
        .where('account_id', 'in', accountIds)
        .execute();

      await trx.deleteFrom('withdrawal')
        .where('account_id', 'in', accountIds)
        .execute();

      await trx.deleteFrom('ticket')
        .where('account_id', 'in', accountIds)
        .execute();

      await trx.deleteFrom('account_payment_method')
        .where('account_id', 'in', accountIds)
        .execute();

      await trx.deleteFrom('ranks_snapshot')
        .where('account_id', 'in', accountIds)
        .execute();

      await trx.deleteFrom('ranks_monthly_snapshot')
        .where('account_id', 'in', accountIds)
        .execute();

      await trx.deleteFrom('account_activity').execute();
      await trx.deleteFrom('account_notification').execute();

      await trx.deleteFrom('account')
        .where('account_id', 'in', accountIds)
        .execute();
    })

    return { message: 'Distributors reset completed' };
  }
};
