import db from 'src/db/db-client';
import { QueryParams, applyPagination, generateMeta, getTotalRecords } from '@utils/pagination';
import { BadRequestException, NotFoundException } from '@utils/errors';
import { IdGenerator } from '@utils/id-generator';
import { findAppSettings, generateDateNow } from '@utils/helpers';
import { Status } from '@common/constants/status';
import { Kysely, sql } from 'kysely';
import _ from 'lodash';
import { DB, WalletTransaction } from 'src/db/generated/generated-types';
import { Wallet } from '@common/constants/wallet';
import { adminService } from '@features/admin/admin.service';
import { getCurrentDayRange } from '@utils/date';
import { Settings } from '@common/constants/settings';
import { filterByDateRange } from '@utils/filters';

export const walletService = {
  async getWallets(q: QueryParams) {
    const baseQuery = db.selectFrom('wallet');

    const totalRecords = await getTotalRecords(baseQuery);

    const data = await baseQuery
      .selectAll()
      .$call((eb) => applyPagination(eb, q))
      .orderBy('created_at', 'desc')
      .execute();

    const meta = generateMeta(q, totalRecords);

    return { data, meta };
  },

  async findWallet(accountId: string) {
    const wallet = await db.selectFrom('wallet')
      .select([
        'wallet_id',
        'wallet_amount'
      ])
      .where('account_id', '=', accountId)
      .executeTakeFirst();

    if (_.isEmpty(wallet)) {
      return {
        wallet_id: IdGenerator.generateUUID(),
        wallet_amount: 0
      };
    }

    return wallet;
  },

  async findWalletsByAccountIds(accountIds: string[]) {
    const records = await db.selectFrom('wallet')
      .select([
        'account_id',
        'wallet_id',
        'wallet_amount',
        'wallet_status'
      ])
      .where('account_id', 'in', accountIds)
      .execute();

    return new Map(records.map((record) => [record.account_id, record.wallet_id]));
  },

  async bulkCreateWallets(walletsToCreate: any[], trx: any = null) {
    const walletData = [];
    const transactionHistoryData = [];

    const transactionDb: Kysely<DB> = trx ?? db;

    for (const data of walletsToCreate) {
      const walletId = IdGenerator.generateUUID();

      walletData.push({
        wallet_id: walletId,
        account_id: data.account_id,
        wallet_amount: data.commission_amount.toFixed(2),
        wallet_status: Status.ACTIVE,
        created_at: generateDateNow(),
        updated_at: generateDateNow()
      });

      transactionHistoryData.push({
        wallet_transaction_id: IdGenerator.generateUUID(),
        wallet_id: walletId,
        withdrawal_id: null,
        wallet_transaction_amount: data.commission_amount.toFixed(2),
        wallet_transaction_type: Status.IN,
        wallet_transaction_status: Status.COMPLETED,
        wallet_transaction_title: data.commission_type,
        created_at: generateDateNow(),
        updated_at: generateDateNow()
      });
    }

    await transactionDb.insertInto('wallet').values(walletData).execute();
    await transactionDb.insertInto('wallet_transaction').values(transactionHistoryData).execute();
  },

  async bulkCreateHistory(transactionHistoryData: WalletTransaction[] | any, trx: any = null) {
    const transactionDb: Kysely<DB> = trx ?? db;
    return await transactionDb.insertInto('wallet_transaction').values(transactionHistoryData).execute();
  },

  async bulkUpdateWallets(walletsToUpdate: any[], trx: any = null) {
    const transactionDb: Kysely<DB> = trx ?? db;

    const bulkWrites = walletsToUpdate.map((update) => {
      return transactionDb
        .updateTable('wallet')
        .set({
          wallet_amount: sql`wallet_amount + ${update.commission_amount.toFixed(2)}`,
          updated_at: generateDateNow()
        })
        .where('account_id', '=', update.account_id)
        .execute();
    });

    await Promise.all(bulkWrites);
  },

  async getAllTransactionHistory(accountId: string, q: QueryParams) {
    const baseQuery = db
      .selectFrom('wallet_transaction as wt')
      .innerJoin('wallet as w', 'wt.wallet_id', 'w.wallet_id')
      .leftJoin('withdrawal as wl', 'wt.withdrawal_id', 'wl.withdrawal_id')
      .where('w.account_id', '=', accountId);

    const totalRecords = await getTotalRecords(baseQuery);

    const data = await baseQuery
      .select([
        'wt.wallet_transaction_id',
        'w.wallet_id',
        'w.account_id',
        'wt.wallet_transaction_amount',
        'wt.wallet_transaction_type',
        'wt.wallet_transaction_status',
        'wt.wallet_transaction_title',
        'wl.withdrawal_status',
        'wl.ref_no',
        'wt.created_at',
        'wt.updated_at'
      ])
      .$call((eb) => applyPagination(eb, q))
      .$call((eb: any) => filterByDateRange(eb, q, 'wt'))
      .orderBy('wt.created_at', 'desc')
      .execute();

    const meta = generateMeta(q, totalRecords);

    return { data, meta };
  },

  async hasOnGoingWithdrawal(accountId: string) {
    const withdraw = await db.selectFrom('withdrawal').selectAll().where('account_id', '=', accountId).where('withdrawal_status', 'in', [Status.PENDING]).executeTakeFirst();

    if (!_.isEmpty(withdraw)) {
      return true;
    }

    return false;
  },

  async hasExceededMaxCashout(accountId: string) {
    const { startOfDay, endOfDay } = getCurrentDayRange();

    const maxCashoutPerDay = await findAppSettings(Settings.MAX_CASHOUT_PER_DAY) ?? 5;

    const cashouts = await db.selectFrom('withdrawal')
      .select([
        sql`COUNT(account_id)`.as('count')
      ])
      .where('account_id', '=', accountId)
      .where('created_at', '>=', startOfDay)
      .where('created_at', '<=', endOfDay)
      .executeTakeFirst();

    const usedCashout = cashouts?.count ?? 0;

    if (maxCashoutPerDay >= usedCashout) {
      throw new BadRequestException('You have exceeded the maxmimum cashout per day.')
    }

    return;
  },

  async requestCashout(accountId: string, amount: string | any) {
    if (!(await this.hasPaymentMethod(accountId))) {
      throw new BadRequestException('Please input a payment method first.');
    }

    await this.checkMaxCashoutPerDay(accountId);

    const minWithdraw = await adminService.getMinWithdrawAmount();
    if (!(+amount >= +minWithdraw)) {
      throw new BadRequestException(`Minimum withdrawal amount is ${minWithdraw}.`);
    }

    if (await this.hasOnGoingWithdrawal(accountId)) {
      throw new BadRequestException('Wait for the ongoing withdrawal to be completed.');
    }

    const wallet = await this.findWallet(accountId);

    if (!wallet) {
      throw new NotFoundException('Wallet not found.');
    }

    if (wallet?.wallet_amount < amount) {
      throw new BadRequestException('Insufficient funds.');
    }

    const withdraw = this.prepareWithdrawalData(accountId, amount);
    const history = this.prepareTransactionHistory(wallet.wallet_id, withdraw.withdrawal_id, amount);

    await db.insertInto('withdrawal').values(withdraw).execute();
    await db.insertInto('wallet_transaction').values(history).execute();
  },

  prepareWithdrawalData(accountId: string, amount: string) {
    return {
      withdrawal_id: IdGenerator.generateUUID(),
      account_id: accountId,
      withdrawal_amount: amount,
      withdrawal_status: Status.PENDING,
      created_at: generateDateNow(),
      updated_at: generateDateNow()
    };
  },

  prepareTransactionHistory(walletId: string, withdrawalId: string, amount: string) {
    return {
      wallet_transaction_id: IdGenerator.generateUUID(),
      wallet_id: walletId,
      withdrawal_id: withdrawalId,
      wallet_transaction_status: Status.PENDING,
      wallet_transaction_amount: amount,
      wallet_transaction_type: Status.OUT,
      wallet_transaction_title: Wallet.WITHDRAWAL,
      created_at: generateDateNow(),
      updated_at: generateDateNow()
    };
  },

  async hasPaymentMethod(accountId: string) {
    const paymentMethod = await db.selectFrom('account_payment_method').selectAll().where('account_id', '=', accountId).executeTakeFirst();

    if (!_.isEmpty(paymentMethod)) {
      return true;
    }

    return false;
  },

  async createWallet(accountId: string) {
    const walletData = {
      wallet_id: IdGenerator.generateUUID(),
      account_id: accountId,
      wallet_amount: String(0),
      wallet_status: Status.ACTIVE,
      created_at: generateDateNow(),
      updated_at: generateDateNow()
    };

    await db.insertInto('wallet').values(walletData).execute();
  },

  async checkMaxCashoutPerDay(accountId: string) {
    const maxCashoutPerDay = await adminService.getMaxCashoutPerDay() ?? 5;
    const { startOfDay, endOfDay } = getCurrentDayRange();

    const records = await db.selectFrom('withdrawal as w')
      .select([
        'w.withdrawal_id',
        'w.account_id',
        sql`COUNT(w.account_id)`.as('count')
      ])
      .groupBy(['w.account_id', 'w.withdrawal_id'])
      .where('w.account_id', '=', accountId)
      .where('w.created_at', '>=', startOfDay)
      .where('w.created_at', '<=', endOfDay)
      .executeTakeFirst();

    // @ts-ignore
    if (records?.count >= maxCashoutPerDay) {
      throw new BadRequestException('You have exceeded the maximum cashout per day.');
    }

    return;
  },

  async incrementWallet(accountId: string, amount: string | number) {
    await db.updateTable('wallet')
      .set({ wallet_amount: sql`wallet_amount + ${amount}` })
      .where('account_id', '=', accountId)
      .execute();
  },

  async incrementWalletWithTransaction(accountId: string, amount: string | number, trx: Kysely<DB>) {
    return await trx.updateTable('wallet')
      .set({ wallet_amount: sql`wallet_amount + ${amount}` })
      .where('account_id', '=', accountId)
      .execute();
  },

  async getWalletId(accountId: string) {
    const data = await db.selectFrom('wallet')
      .select(['wallet_id'])
      .where('account_id', '=', accountId)
      .executeTakeFirst();

    if (!data) {
      throw new NotFoundException('Wallet not found.');
    }

    return data.wallet_id;
  }
};
