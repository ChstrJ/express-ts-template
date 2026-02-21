import { accountRepository } from '@features/account/account.repository';
import { networkTreeService } from '@features/network-tree/network-tree.service';
import { salesService } from '@features/sales/sales.service';
import { accountPermissionRepository } from '@features/account-permission/account-permission.repository';
import { accountService } from '@features/account/account.service';
import { chatService } from '@features/chat/chat.service';
import { ticketService } from '@features/ticket/ticket.service';
import { orderService } from '@features/order/order.service';
import { walletService } from '@features/wallet/wallet.service';
import { NotifCode } from '@common/constants/notifs-code';
import { Role } from '@common/constants/roles';
import { Sales } from '@common/constants/sales';
import { Status } from '@common/constants/status';
import { AlreadyExistsException, BadRequestException, NotFoundException } from '@utils/errors';
import { formatName, generateAppLink, generateDateNow, generateFileKey, generateOrderPickupKey, getAccountName, getImageUrl, getOrderNotifCode, logActivity, realtime } from '@utils/helpers';
import { IdGenerator } from '@utils/id-generator';
import { applyLimit, applyPagination, generateMeta, getTotalRecords, QueryParams } from '@utils/pagination';
import { sql } from 'kysely';
import _ from 'lodash';
import db from 'src/db/db-client';
import { Account } from 'src/db/generated/generated-types';
import { EmailType } from '@common/constants/email';
import { EmailJob } from 'src/jobs/email';
import { sendOrderStatusUpdateSms } from '@lib/sms';
import { Event } from '@common/constants/realtime';
import { AlertJob } from 'src/jobs/alert';
import { Commission } from '@common/constants/commission';
import { CreateRankSetting, UpdateRankSetting } from '@common/schema/ranks';
import logger from '@utils/logger';
import { Log } from '@common/constants/log';
import { Settings } from "@common/constants/settings";
import { applySearch } from '@utils/search';
import { commissionService } from '@features/commission/commission.service';
import { withdrawalService } from '@features/withdrawal/withdrawal.service';
import { teamService } from '@features/team/team.service';
import { deleteFile, uploadFile } from '@lib/r2';
import { CreateFile } from '@common/schema/files';
import axios from 'axios';
import { referralCodeService } from '@features/referral-code/referral-code.service';
import { productsService } from '@features/products/products.service';

export const adminService = {
  async getAccount(accountId: string) {
    const results = await db
      .selectFrom('account as a')
      .leftJoin('account_product_package as app', 'a.account_id', 'app.account_id')
      .leftJoin('product_package as pp', 'app.product_package_id', 'pp.product_package_id')
      .select([
        'a.account_status',
        'a.account_first_name',
        'a.account_last_name',
        sql`CONCAT(a.account_first_name, ' ', a.account_last_name)`.as('account_name'),
        'a.account_email',
        'app.product_package_price as package_price',
        'pp.product_package_name'
      ])
      .where('a.account_id', '=', accountId)
      .executeTakeFirstOrThrow(() => new NotFoundException('Account not found.'));

    return results;
  },

  async getOrder(orderId: string) {
    const results = await db
      .selectFrom('order as o')
      .leftJoin('order_payment as op', 'o.order_id', 'op.order_id')
      .innerJoin('account as a', 'a.account_id', 'o.account_id')
      .select([
        'o.order_status',
        'o.order_number',
        'o.total_amount',
        'a.account_id',
        'a.account_first_name',
        'op.order_payment_id',
        'op.order_payment_status',
        'a.account_last_name',
        'a.account_email',
        'a.account_contact_number'
      ])
      .where('o.order_id', '=', orderId)
      .executeTakeFirstOrThrow();

    return results;
  },

  async setAccountStatus(adminId: string, accountId: string, data: any) {
    const account = await this.getAccount(accountId);
    let accountStatus = data.status;

    if (account?.account_status === Status.ACTIVE) {
      throw new BadRequestException('Account is already activated.');
    }

    if (data.status === Status.APPROVED) {
      accountStatus = Status.ACTIVE;

      await walletService.createWallet(accountId);
      await accountService.updateAccountStatus(accountId, accountStatus);

      await db
        .updateTable('account_product_package')
        .set({
          created_at: generateDateNow(),
          updated_at: generateDateNow()
        })
        .where('account_id', '=', accountId)
        .execute();

      const referral = await accountService.getReferralDetails(accountId);

      if (!_.isEmpty(referral)) {
        await AlertJob.addToQueue({
          code: NotifCode.USED_REFERRAL,
          ids: referral?.referred_by_id
        });

        await EmailJob.addToQueue({
          type: EmailType.USED_REFERRAL_EMAIL,
          payload: {
            to: referral.account_email,
            account_name: referral.account_name,
            referred_name: formatName(account.account_first_name, account.account_last_name),
          }
        })
      }

      await teamService.createTeam(accountId);
      await salesService.saveSales(accountId, account?.package_price, Sales.TYPE_PACKAGE);
      await networkTreeService.addUserToTree(accountId, referral?.referred_by_id);
      await commissionService.computeCommission(accountId, Commission.TYPE_PACKAGE, Number(account?.package_price));

      await AlertJob.addToQueue({
        code: NotifCode.DISTRIBUTOR_APPROVED,
        ids: accountId
      });

      await EmailJob.addToQueue({
        type: EmailType.WELCOME_EMAIL,
        payload: {
          to: account.account_email,
          account_name: formatName(account.account_first_name, account.account_last_name),
          package_name: account.product_package_name,
          amount: account.package_price ?? 0
        }
      });

      await logActivity({
        accountId: adminId,
        action: Log.ACTION_UPDATE,
        message: `Account ${account.account_name} status updated to ${data.status}`,
        type: Log.TYPE_ACCOUNT,
        typeId: accountId,
      });

      return true;
    }

    if (data.status === Status.REJECTED) {
      await this.hasOngoingAccountReason(accountId);

      await db
        .insertInto('account_reason')
        .values({
          account_reason_id: IdGenerator.generateUUID(),
          account_id: accountId,
          reason_type: 'rejected',
          reason_message: data.reason,
          created_at: generateDateNow(),
          updated_at: generateDateNow()
        })
        .execute();

      await EmailJob.addToQueue({
        type: EmailType.REJECTED_EMAIL,
        payload: {
          to: account.account_email,
          account_name: formatName(account.account_first_name, account.account_last_name),
          package_name: account.product_package_name
        }
      });
    }

    await db
      .updateTable('account')
      .set({
        account_status: accountStatus
      })
      .where('account_id', '=', accountId)
      .execute();

    await logActivity({
      accountId: adminId,
      action: Log.ACTION_UPDATE,
      message: `${account.account_name} status updated to ${data.status}`,
      type: Log.TYPE_ACCOUNT,
      typeId: accountId,
    });

    return true;
  },

  async setOrderStatus(adminId: string, orderId: string, status: string) {
    const order = await this.getOrder(orderId);
    let orderStatus = status;
    const accountId = order.account_id;

    if (order.order_status === Status.COMPLETED) {
      throw new BadRequestException('Order is already completed.');
    }

    if (status === Status.APPROVED && order.order_status !== Status.APPROVED) {
      orderStatus = Status.APPROVED;

      await sendOrderStatusUpdateSms(order.account_contact_number, {
        name: formatName(order.account_first_name, order.account_last_name),
        status: orderStatus,
        amount: order.total_amount ?? 0
      })

      await db.updateTable('order_payment')
        .set({ order_payment_status: Status.APPROVED })
        .where('order_id', '=', orderId)
        .execute();
    }

    if (status === Status.COMPLETED) {
      orderStatus = Status.COMPLETED;

      if (order.order_payment_status !== Status.VERIFIED) {
        throw new BadRequestException('The order payment need to be verified first.');
      }

      const productPv = await orderService.getOrderItemsPV(orderId);

      await accountService.insertAccountPV(accountId, productPv);
      await salesService.saveSales(accountId, order.total_amount ?? 0, Sales.TYPE_PRODUCT);
      //await commissionService.disburseCommission(accountId, Commission.TYPE_PRODUCT, orderId);
    }

    if (status === Status.REJECTED) {
      await db.updateTable('order_payment')
        .set({ order_payment_status: Status.REJECTED })
        .where('order_id', '=', orderId)
        .execute();
    }

    await db
      .updateTable('order')
      .set({
        order_status: orderStatus
      })
      .where('order_id', '=', orderId)
      .execute();

    await this.sendOrderUpdateEmail(orderStatus, order);

    await AlertJob.addToQueue({
      ids: accountId,
      code: getOrderNotifCode(status),
      content: {
        link: 'order-inventory',
        order_id: orderId
      }
    });

    await logActivity({
      accountId: adminId,
      action: Log.ACTION_UPDATE,
      message: `${order.order_number} status updated to ${status}`,
      type: Log.TYPE_ORDER,
      typeId: orderId,
    });

    return true;
  },

  async setOrderPaymentStatus(adminId: string, orderId: string, status: string) {
    const order = await this.getOrder(orderId);
    let orderPaymentStatus = status;
    const accountId = order.account_id;

    if (order.order_payment_status === Status.VERIFIED) {
      throw new BadRequestException('Order payment is already verified.');
    }

    if (status === Status.VERIFIED) {
      orderPaymentStatus = Status.PREPARING;

      await db.updateTable('order')
        .set({ order_status: Status.PREPARING })
        .where('order_id', '=', orderId)
        .execute();
    }

    if (status === Status.REJECTED) {
      await db.updateTable('order')
        .set({ order_status: Status.REJECTED })
        .where('order_id', '=', orderId)
        .execute();
    }

    await db
      .updateTable('order_payment')
      .set({
        order_payment_status: orderPaymentStatus
      })
      .where('order_id', '=', orderId)
      .execute();

    await AlertJob.addToQueue({
      ids: accountId,
      code: getOrderNotifCode(status),
      content: {
        link: 'order-inventory',
        order_id: orderId
      }
    });

    await logActivity({
      accountId: adminId,
      action: Log.ACTION_UPDATE,
      message: `${order.order_number} payment status updated to ${orderPaymentStatus}`,
      type: Log.TYPE_ORDER_PAYMENT,
      typeId: order.order_payment_id ?? null,
    });

    return true;
  },

  async listPendingDistributors(q: QueryParams) {
    return await accountRepository.getPendingDistributors(q);
  },

  async listRejectedDistributors(q: QueryParams) {
    const baseQuery = db
      .selectFrom('account as a')
      .innerJoin('account_reason as ar', 'a.account_id', 'ar.account_id')
      .where('a.account_status', '=', Status.REJECTED);

    const totalRecords = await getTotalRecords(baseQuery);

    const data = await baseQuery
      .where('a.account_status', '=', Status.REJECTED)
      .select([
        'a.account_id',
        sql`CONCAT(a.account_first_name, ' ', a.account_last_name)`.as('full_name'),
        'a.account_email',
        'a.account_contact_number',
        'ar.reason_type',
        'ar.reason_message',
        'a.created_at',
        'a.updated_at'
      ])
      .$call((eb) => applyPagination(eb, q))
      .execute();

    const meta = generateMeta(q, totalRecords);

    return { data, meta };
  },

  async listDistributors(q: QueryParams) {
    return await accountRepository.listDistributors(q);
  },

  async createLevel(adminId: string, data: any) {
    const insertData = {
      commission_level_id: IdGenerator.generateUUID(),
      commission_level: data.level,
      commission_percentage: data.percentage,
      created_at: new Date(),
      updated_at: new Date()
    };

    try {
      await db.insertInto('commission_level').values(insertData).execute();

      await logActivity({
        accountId: adminId,
        action: Log.ACTION_CREATE,
        message: `Commission level ${data.level} created`,
        type: Log.TYPE_COMMISSION_LEVEL,
        typeId: insertData.commission_level_id,
      });
    } catch (err: any) {
      if (err.code === 'ER_DUP_ENTRY') {
        throw new AlreadyExistsException('Level already exists');
      }
      throw err;
    }

    return true;
  },

  async listLevels() {
    return await db
      .selectFrom('commission_level')
      .select(['commission_level_id', 'commission_level', 'commission_percentage'])
      .orderBy('commission_level', 'asc')
      .execute();
  },

  async updateLevel(adminId: string, levelId: string, data: any) {
    const update = {
      commission_level: data?.level,
      commission_percentage: data?.percentage,
      updated_at: new Date()
    };

    await db.updateTable('commission_level')
      .set(update)
      .where('commission_level_id', '=', levelId)
      .execute();

    const updated = await db.selectFrom('commission_level')
      .select(['commission_level', 'commission_percentage'])
      .where('commission_level_id', '=', levelId)
      .executeTakeFirst();

    await logActivity({
      accountId: adminId,
      action: Log.ACTION_UPDATE,
      message: `Commission level ${updated?.commission_level} percentage updated to ${data?.percentage}`,
      type: Log.TYPE_COMMISSION_LEVEL,
      typeId: levelId,
    });

    return true;
  },

  async deleteLevel(adminId: string, levelId: string) {
    await db.deleteFrom('commission_level').where('commission_level_id', '=', levelId).execute();

    await logActivity({
      accountId: adminId,
      action: Log.ACTION_DELETE,
      message: `Commission level ${levelId} deleted`,
      type: Log.TYPE_COMMISSION_LEVEL,
      typeId: levelId,
    });

    return true;
  },

  async listNetworkByAccountId(accountId: string) {
    const records = await networkTreeService.listNetworkV2(accountId);

    return records.map((record: Account | any) => {
      return {
        ...record,
        account_image: getImageUrl(record.account_image)
      };
    });
  },

  async getDashboardStats() {
    const result = await db
      .selectFrom('account as a')
      .select(() => [
        sql<number>`SUM(a.account_role = ${Role.DISTRIBUTOR})`.as('total_users'),
        sql<number>`SUM(a.account_status = ${Status.ACTIVE} AND a.account_role = ${Role.DISTRIBUTOR})`.as('active_distributors')
      ])
      .executeTakeFirst();

    const { grandTotalSales } = await salesService.totalSales();
    const { grandTotalCommission, totalCPQ } = await commissionService.getGrandTotalCommission();
    const releasedAmount = await withdrawalService.sumWithdrawal();

    return {
      totalUsers: +(result?.total_users ?? 0),
      activeDistributors: +(result?.active_distributors ?? 0),
      totalSales: grandTotalSales ?? 0,
      totalCommission: +(grandTotalCommission ?? 0).toFixed(2),
      totalUnreleased: +(grandTotalCommission - releasedAmount).toFixed(2),
      totalReleased: releasedAmount,
      totalCPQ: totalCPQ
    };
  },

  async getAdminIds() {
    const results = await db.selectFrom('account').where('account_role', 'in', Role.ADMIN_ROLES).select(['account_id']).execute();

    return results.map((id) => id.account_id);
  },

  async getAdminNumbers() {
    const results = await db.selectFrom('account').where('account_role', 'in', Role.ADMIN_ROLES).select(['account_contact_number']).execute();

    return results.map((id) => id.account_contact_number);
  },

  async listAdmins(q: QueryParams) {
    const baseQuery = db
      .selectFrom('account as a')
      .leftJoin('account_permission as ap', 'a.account_id', 'ap.account_id')
      .where('a.account_role', 'in', [Role.ADMIN, Role.CSR, Role.WAREHOUSE, Role.FINANCE]);

    const totalRecords = await getTotalRecords(baseQuery);

    const data = await baseQuery
      .select([
        'a.account_id',
        'a.account_email',
        'a.account_first_name',
        'a.account_last_name',
        'a.account_role',
        'a.account_contact_number',
        'a.account_status',
        'ap.permission_meta'
      ])
      .$call((eb) => applyPagination(eb, q))
      .$call((eb: any) => applySearch(eb, q, 'a', ['account_first_name', 'account_last_name']))
      .execute();

    const meta = generateMeta(q, totalRecords);

    return { data, meta };
  },

  async createAdmin(data: Record<string, string>) {
    const permissions = data.permissions;

    const accountData = _.assign(
      {
        status: Status.ACTIVE,
        role: Role.ADMIN
      },
      data
    );

    const account = await accountRepository.createAccount(accountData);

    await accountPermissionRepository.insertPermission(account.account_id, permissions);

    return true;
  },

  async updatePermission(accountId: string, data: Record<string, any>) {
    await accountService.editAccount(accountId, data);
    await accountPermissionRepository.updatePermission(accountId, data.permissions);

    return true;
  },

  async setWithdrawalStatus(adminId: string, withdrawalId: string, data: Record<string, any>) {
    const withdraw = await withdrawalService.findWithdrawal(withdrawalId);

    if (withdraw.withdrawal_status === Status.COMPLETED && data.status === Status.COMPLETED) {
      throw new BadRequestException('Withdrawal is already completed.');
    }

    if (data.status === Status.COMPLETED) {
      await this.processWithdrawalComplete(withdrawalId, withdraw, data);

      await logActivity({
        accountId: adminId,
        action: Log.ACTION_UPDATE,
        message: `Withdrawal ${withdrawalId} updated`,
        type: Log.TYPE_WITHDRAWAL,
        typeId: withdrawalId,
      });

      return;
    }

    await db
      .updateTable('withdrawal')
      .set({
        withdrawal_status: data.status
      })
      .where('withdrawal_id', '=', withdrawalId)
      .execute();

    await logActivity({
      accountId: adminId,
      action: Log.ACTION_UPDATE,
      message: `Withdrawal ${withdrawalId} updated`,
      type: Log.TYPE_WITHDRAWAL,
      typeId: withdrawalId,
    });
  },

  async hasOngoingAccountReason(accountId: string) {
    const data = await db
      .selectFrom('account_reason')
      .select(['account_reason_id'])
      .where('account_id', '=', accountId)
      .executeTakeFirst();

    if (data) {
      throw new BadRequestException('Already submitted a declined reason.');
    }

    return;
  },

  async setMinWithdrawAmount(adminId: string, minWithdrawAmount: number) {
    const data = {
      app_settings_id: IdGenerator.generateUUID(),
      key: 'min_withdraw_amount',
      value: String(minWithdrawAmount),
      created_at: generateDateNow(),
      updated_at: generateDateNow()
    };

    await db
      .insertInto('app_settings')
      .values(data)
      .onDuplicateKeyUpdate({
        value: String(minWithdrawAmount),
        updated_at: generateDateNow()
      })
      .execute();

    await logActivity({
      accountId: adminId,
      action: Log.ACTION_UPDATE,
      message: `Minimum withdrawal amount updated to ${minWithdrawAmount}`,
      type: Log.TYPE_SETTINGS,
      typeId: data.app_settings_id,
    });
  },

  async getMinWithdrawAmount() {
    const data = await db
      .selectFrom('app_settings')
      .select(['value'])
      .where('key', '=', 'min_withdraw_amount')
      .executeTakeFirst();

    return data ? Number(data.value) : 0;
  },

  async findAppSettings(key: string) {
    const data = await db
      .selectFrom('app_settings')
      .select(['value'])
      .where('key', '=', key)
      .executeTakeFirst();

    return data?.value ?? null;
  },

  async createRank(adminId: string, data: CreateRankSetting) {
    const insertData = {
      ranks_id: IdGenerator.generateUUID(),
      name: data.name,
      pv_req: String(data.pv_req),
      gv_req: String(data.gv_req),
      leg_cap: String(data.leg_cap),
      meta: JSON.stringify(data.meta),
      created_at: generateDateNow(),
      updated_at: generateDateNow()
    };

    try {
      await db.insertInto('ranks').values(insertData).execute();

      await logActivity({
        accountId: adminId,
        action: Log.ACTION_CREATE,
        message: `Rank settings created`,
        type: Log.TYPE_RANK,
        typeId: insertData.ranks_id,
      });
    } catch (e) {
      logger.error(e);
      return false;
    }

    return true;
  },

  async getRankSettings() {
    return await db.selectFrom('ranks')
      .select([
        'ranks_id',
        'name',
        'pv_req',
        'gv_req',
        'meta',
        'leg_cap',
      ])
      .orderBy('gv_req', 'asc')
      .execute();
  },

  async updateRank(adminId: string, data: UpdateRankSetting, rankSettingId: string) {
    const updateData = {
      name: data?.name,
      pv_req: String(data?.pv_req),
      gv_req: String(data?.gv_req),
      leg_cap: String(data?.leg_cap),
      meta: JSON.stringify(data.meta),
      updated_at: generateDateNow()
    };

    try {
      await db.updateTable('ranks').set(updateData).where('ranks_id', '=', rankSettingId).execute();

      await logActivity({
        accountId: adminId,
        action: Log.ACTION_UPDATE,
        message: `Rank settings updated`,
        type: Log.TYPE_RANK,
        typeId: rankSettingId,
      });
    } catch (e) {
      logger.error(e);
      return false;
    }

    return true;
  },

  async deleteRank(adminId: string, rankSettingId: string) {
    try {
      await db.deleteFrom('ranks').where('ranks_id', '=', rankSettingId).execute();

      await logActivity({
        accountId: adminId,
        action: Log.ACTION_DELETE,
        message: `Rank settings deleted`,
        type: Log.TYPE_RANK,
        typeId: rankSettingId,
      });
    } catch (e) {
      logger.error(e);
      return false;
    }

    return true;
  },

  async getRanks() {
    return await db.selectFrom('ranks').selectAll().orderBy('pv_req', 'asc').execute();
  },

  async topReferrals(q: QueryParams) {
    const records = await db
      .selectFrom('account_referral as rf')
      .innerJoin('account as a', 'rf.referred_by_id', 'a.account_id')
      .select([
        'rf.referred_by_id as account_id',
        sql<string>`CONCAT(a.account_first_name, ' ', a.account_last_name)`.as('account_name'),
        'a.account_email',
        'a.account_contact_number',
        'a.account_image',
        sql<number>`COUNT(*)`.as('total_referrals')
      ])
      .groupBy('rf.referred_by_id')
      .orderBy('total_referrals', 'desc')
      .$call((eb) => applyLimit(eb, q))
      .execute();

    return records.map((record: Account) => {
      return {
        ...record,
        account_image: getImageUrl(record.account_image)
      };
    });
  },

  async topCommissions(q: QueryParams) {
    const records = await db
      .selectFrom('commission as c')
      .innerJoin('account as a', 'c.account_id', 'a.account_id')
      .select([
        'c.account_id',
        sql<string>`CONCAT(a.account_first_name, ' ', a.account_last_name)`.as('account_name'),
        'a.account_email',
        'a.account_contact_number',
        'a.account_image',
        sql<number>`SUM(c.commission_amount)`.as('total_commission')
      ])
      .where('c.commission_status', '=', Status.RELEASED)
      .groupBy('c.account_id')
      .orderBy('total_commission', 'desc')
      .$call((eb) => applyLimit(eb, q))
      .execute();

    return records.map((record: Account) => {
      return {
        ...record,
        account_image: getImageUrl(record.account_image)
      };
    });
  },

  async getChatHistory(accountId: string, q: QueryParams) {
    return await chatService.getChats({ accountId: accountId, q: q });
  },

  async processWithdrawalComplete(withdrawalId: string, withdraw: Record<string, any>, data: Record<string, any>) {
    await db.transaction().execute(async (trx) => {
      const wallet = await trx
        .selectFrom('wallet')
        .select(['wallet_amount'])
        .where('wallet_id', '=', withdraw.wallet_id)
        .forUpdate()
        .executeTakeFirstOrThrow();

      const withdrawAmount = +withdraw.withdrawal_amount;
      const walletAmount = +wallet.wallet_amount;
      const refNumber = data.ref_no;

      const newAmount = walletAmount - withdrawAmount;

      if (newAmount < 0) {
        throw new BadRequestException('Insufficient wallet balance.');
      }

      await trx
        .updateTable('wallet')
        .set({ wallet_amount: String(newAmount) })
        .where('wallet_id', '=', withdraw.wallet_id)
        .execute();

      await trx
        .updateTable('wallet_transaction')
        .set({ wallet_transaction_status: data.status })
        .where('wallet_id', '=', withdraw.wallet_id)
        .execute();

      await trx
        .updateTable('withdrawal')
        .set({
          withdrawal_status: data.status,
          ref_no: refNumber
        })
        .where('withdrawal_id', '=', withdrawalId)
        .execute();
    });
  },

  async getChat(accountId: string, q: QueryParams) {
    return await chatService.getChats({ accountId: accountId, q: q });
  },

  async assignCsrToTicket(adminId: string, ticketId: string, csrId: string) {
    const ticket = await ticketService.findTicketById(ticketId);
    const customerId = ticket.account_id;
    const chatId = ticket.chat_id;
    const channel = `chat:${chatId}`;

    if (ticket.ticket_status != Status.OPEN) {
      throw new BadRequestException('Ticket is not open.');
    }

    const csrName = await getAccountName(csrId);
    await ticketService.setCsrToTicket(ticketId, csrId);
    await ticketService.setTicketStatus(ticketId, Status.IN_PROGRESS);

    const chatParticipantsData = Object.values({ csrId, customerId }).map((datum) => {
      return {
        chat_participants_id: IdGenerator.generateUUID(),
        chat_id: chatId,
        account_id: datum,
        created_at: generateDateNow(),
        updated_at: generateDateNow()
      };
    });

    await db.insertInto('chat_participants').values(chatParticipantsData).execute();

    realtime(`global-notif:${customerId}`, Event.ASSIGNED_TICKET, {
      message: `Your ticket ${ticket.ticket_number} has been assigned to one of our team.`,
      channel: channel
    });

    realtime(`global-notif:${csrId}`, Event.CSR_ASSIGNED_TICKET, {
      message: `You have been assigned a new ticket ${ticket.ticket_number}.`,
      channel: channel
    });

    await logActivity({
      accountId: adminId,
      action: Log.ACTION_UPDATE,
      message: `CSR ${csrName} assigned to ticket ${ticketId}`,
      type: Log.TYPE_TICKET,
      typeId: ticketId,
    });

    return channel;
  },

  async setTicketStatus(adminId: string, ticketId: string, status: string) {
    const ticket = await ticketService.findTicketById(ticketId);
    await ticketService.setTicketStatus(ticketId, status);

    await logActivity({
      accountId: adminId,
      action: Log.ACTION_UPDATE,
      message: `Ticket ${ticket.ticket_number} status updated to ${status}`,
      type: Log.TYPE_TICKET,
      typeId: ticketId,
    });

    return true;
  },

  async setAppSettings(key: string, value: string) {
    const data = {
      app_settings_id: IdGenerator.generateUUID(),
      key: key,
      value: value,
      created_at: generateDateNow(),
      updated_at: generateDateNow()
    };

    await db
      .insertInto('app_settings')
      .values(data)
      .onDuplicateKeyUpdate({
        value: value,
        updated_at: generateDateNow()
      })
      .execute();

    return data;
  },

  async setMaxCashoutPerDay(adminId: string, maxCashoutPerday: string) {
    const data = await this.setAppSettings('max_cashout_per_day', maxCashoutPerday);

    await logActivity({
      accountId: adminId,
      action: Log.ACTION_UPDATE,
      message: `Max cashout per day updated to ${maxCashoutPerday}`,
      type: Log.TYPE_SETTINGS,
      typeId: data.app_settings_id,
    });

    return true;
  },

  async setLowStockThreshold(adminId: string, threshold: string) {
    const data = await this.setAppSettings(Settings.LOW_STOCK_THRESHOLD, threshold);

    await logActivity({
      accountId: adminId,
      action: Log.ACTION_UPDATE,
      message: `Low stock threshold updated to ${threshold}`,
      type: Log.TYPE_SETTINGS,
      typeId: data.app_settings_id,
    });

    return true;
  },

  async getMaxCashoutPerDay() {
    return await this.findAppSettings(Settings.MAX_CASHOUT_PER_DAY);
  },

  async getLowStockThreshold() {
    return await this.findAppSettings(Settings.LOW_STOCK_THRESHOLD);
  },

  async viewWallet(q: QueryParams) {
    const baseQuery = db.selectFrom('wallet as w')
      .innerJoin('account as a', 'w.account_id', 'a.account_id')

    const totalRecords = await getTotalRecords(baseQuery);

    const data = await baseQuery
      .select([
        'w.wallet_id',
        'a.account_id',
        sql`CONCAT(a.account_first_name, ' ', a.account_last_name)`.as('account_name'),
        'w.wallet_amount',
        'w.wallet_status'
      ])
      .$call((eb) => applyPagination(eb, q))
      .$call((eb: any) => applySearch(eb, q, 'a', ['account_first_name', 'account_last_name']))
      .execute();

    const meta = generateMeta(q, totalRecords);

    return { data, meta }
  },

  async viewWalletHistory(accountId: string, q: QueryParams) {
    return await walletService.getAllTransactionHistory(accountId, q);
  },

  async getRequiredPv() {
    return await this.findAppSettings(Settings.REQUIRED_PV) ?? 0;
  },

  async setRequiredPv(adminId: string, pv: number) {
    const data = {
      app_settings_id: IdGenerator.generateUUID(),
      key: Settings.REQUIRED_PV,
      value: String(pv),
      created_at: generateDateNow(),
      updated_at: generateDateNow()
    };

    await db
      .insertInto('app_settings')
      .values(data)
      .onDuplicateKeyUpdate({
        value: String(pv),
        updated_at: generateDateNow()
      })
      .execute();

    await logActivity({
      accountId: adminId,
      action: Log.ACTION_UPDATE,
      message: `Required PV updated to ${pv}.`,
      type: Log.TYPE_SETTINGS,
      typeId: data.app_settings_id,
    });

    return true;
  },

  async sendOrderUpdateEmail(status: string, order: any) {
    let emailType = '';

    switch (status) {
      case Status.APPROVED:
        emailType = EmailType.ORDER_PAYMENT_EMAIL;
        break;
      case Status.PENDING:
        emailType = EmailType.ORDER_PLACED_EMAIL;
        break;
      case Status.REJECTED:
        emailType = EmailType.ORDER_REJECTED_EMAIL;
        break;
      case Status.READY:
        emailType = EmailType.ORDER_READY_FOR_PICKUP_EMAIL;
        break;
    }

    await EmailJob.addToQueue({
      type: emailType,
      payload: {
        to: order.account_email,
        account_name: formatName(order.account_first_name, order.account_last_name),
        link: generateAppLink('/order-inventory'),
        amount: order.amount,
        order_number: order.order_number
      }
    });
  },

  async uploadDocuments(file: Express.Multer.File, data: CreateFile) {
    try {
      const fileData = await uploadFile(generateFileKey(), file);

      await db.insertInto('file').values({
        file_id: IdGenerator.generateUUID(),
        file_name: fileData?.file_name ?? '',
        file_path: fileData?.file_key ?? '',
        file_type: fileData?.file_mime ?? '',
        file_status: Status.ACTIVE,
        file_doc_type: data.file_doc_type ?? null,
        created_at: generateDateNow(),
        updated_at: generateDateNow(),
      }).execute();
    } catch (err) {
      logger.error(err);
      throw new BadRequestException('Error uploading file.')
    }
  },

  async listDocuments(emailType: string = '') {
    let query = db.selectFrom('file')
      .selectAll()

    if (emailType) {
      query = query.where('file_doc_type', '=', emailType);
    }

    const records = await query.execute();

    return records.map((record) => ({
      ...record,
      file_path: getImageUrl(record.file_path)
    }))
  },

  async formatAttachment(emailType: string) {
    const attachments = [];
    const records = await this.listDocuments(emailType);

    if (_.isEmpty(records)) {
      return [];
    }

    for (const record of records) {
      if (!record.file_path) continue;

      const res = await axios.get(record.file_path, { responseType: 'arraybuffer' });
      const buffer = Buffer.from(res.data);

      attachments.push({
        filename: record.file_name,
        content: buffer.toString('base64'),
      });
    }

    return attachments;
  },

  async deleteDocuments(fileId: string) {
    try {
      const file = await db.selectFrom('file')
        .select([
          'file_path'
        ])
        .where('file_id', '=', fileId)
        .executeTakeFirstOrThrow();

      await deleteFile(file.file_path);

      await db.deleteFrom('file').where('file_id', '=', fileId).execute();
    } catch (err) {
      logger.error(err);
      throw new BadRequestException('Error deleting a file.')
    }
  },

  async hasPendingUser() {
    const data = await db.selectFrom('account')
      .select(['account_id'])
      .where('account_status', '=', Status.PENDING)
      .executeTakeFirst();


    return !_.isEmpty(data);
  },

  async hasOpenTicket() {
    const ticket = await db
      .selectFrom('ticket')
      .select(['ticket_id'])
      .where('ticket_status', '=', Status.OPEN)
      .executeTakeFirst();

    return !_.isEmpty(ticket);
  },

  async hasAssignedTicket(accountId: string) {
    const ticket = await db
      .selectFrom('ticket')
      .select(['ticket_id'])
      .where('ticket_status', '=', Status.IN_PROGRESS)
      .where('csr_id', '=', accountId)
      .executeTakeFirst();

    return !_.isEmpty(ticket);
  },

  async hasPendingWithdrawal() {
    const data = await db.selectFrom('withdrawal')
      .select(['withdrawal_id'])
      .where('withdrawal_status', '=', Status.PENDING)
      .executeTakeFirst();

    return !_.isEmpty(data);
  },

  async sidebarStatus(accountId: string) {
    return {
      'has_pending_user': await this.hasPendingUser(),
      'has_pending_withdrawal': await this.hasPendingWithdrawal(),
      'has_pending_ticket': await this.hasOpenTicket(),
      'has_assigned_ticket': await this.hasAssignedTicket(accountId),
      'has_chat_msg': await accountService.hasChatMessage(accountId),
      'has_low_stock': await productsService.hasLowStockProducts()
    }
  },

  async uploadPickupProof(orderId: string, file: Express.Multer.File) {
    const order = await this.getOrder(orderId);
    const accountId = order.account_id;

    let data = {
      order_pickup_id: IdGenerator.generateUUID(),
      order_id: orderId,
      order_pickup_status: Status.COMPLETED,
      created_at: generateDateNow(),
      updated_at: generateDateNow()
    };

    try {
      if (file) {
        const image = await uploadFile(generateOrderPickupKey(), file);

        data = _.assign(data, { order_pickup_image: image?.file_key });
      }

      if (order.order_payment_status === Status.PREPARING) {
        await db.updateTable('order')
          .set({ order_status: Status.COMPLETED })
          .where('order_id', '=', orderId)
          .execute();

        await db.updateTable('order_payment')
          .set({ order_payment_status: Status.COMPLETED })
          .where('order_id', '=', orderId)
          .execute();

        await db.insertInto('order_pickup').values(data).execute();

        const productPv = await orderService.getOrderItemsPV(orderId);

        await productsService.getOrderQtyChangeAndInsert(orderId, accountId);
        await accountService.insertAccountPV(accountId, productPv);
        await salesService.saveSales(accountId, order.total_amount ?? 0, Sales.TYPE_PRODUCT);
        await commissionService.computeCommission(accountId, Commission.TYPE_PRODUCT, Number(order.total_amount));
      }
    } catch (err) {
      logger.error(err)
      throw new BadRequestException('Order Pick-up proof cannot be uploaded.')
    }

    await EmailJob.addToQueue({
      type: EmailType.ORDER_PICKUP_CONFIRMED_EMAIL,
      payload: {
        to: order.account_email,
        account_name: formatName(order.account_first_name, order.account_last_name),
        link: generateAppLink('/order-inventory'),
        amount: order.total_amount ?? 0,
        order_number: order.order_number
      }
    });


    return { message: 'Pick-up proof uploaded successfully.' }
  },

  async viewPickupProof(orderId: string) {
    const data = await db.selectFrom('order_pickup')
      .select([
        'order_pickup_id',
        'order_pickup_image'
      ])
      .where('order_id', '=', orderId)
      .executeTakeFirst();

    return {
      ...data,
      order_pickup_image: getImageUrl(data?.order_pickup_image ?? '')
    }
  }
};
