import { Role } from '@common/constants/roles';
import { Status } from '@common/constants/status';
import { createPaymentMethod, updateAccount, updatePaymentMethod } from '@common/schema/account';
import { referralCodeRepository } from '@features/referral-code/referral-code.repository';
import { comparePassword, hashPassword } from '@lib/hash';
import { deleteFile, uploadFile } from '@lib/r2';
import { AlreadyExistsException, BadRequestException, NotFoundException } from '@utils/errors';
import { findAppSettings, generateAccountImageKey, generateDateNow, generatePaymentMethodKey, getImageUrl } from '@utils/helpers';
import { IdGenerator } from '@utils/id-generator';
import logger from '@utils/logger';
import { applyLimit, applyPagination, generateMeta, getTotalRecords, QueryParams } from '@utils/pagination';
import { sql } from 'kysely';
import _ from 'lodash';
import { Account, ReferralCode, Team } from 'src/db/generated/generated-types';
import { Settings } from '@common/constants/settings';
import dbClient from "src/db/db-client";
import { getCurrentMonthRange } from '@utils/date';
import { ticketService } from '@features/ticket/ticket.service';
import { teamService } from '@features/team/team.service';
import { commissionService } from '@features/commission/commission.service';
import db from 'src/db/db-client';
import { filterByApprovedOrReady } from '@utils/filters';
import { chatService } from '@features/chat/chat.service';
import { adminService } from '@features/admin/admin.service';
import { RankType } from '@utils/types';
import { Chat } from '@common/constants/chat';

export const accountService = {
  async listNotifications(accountId: string, q: QueryParams) {
    const baseQuery = db.selectFrom('account_notification').where('account_id', '=', accountId);

    const totalRecords = await getTotalRecords(baseQuery);

    const data = await baseQuery
      .select(['account_notification_id', 'code', 'is_read', 'content', 'created_at', 'updated_at'])
      .$call((eb) => applyPagination(eb, q))
      .orderBy('created_at', 'desc')
      .orderBy('is_read', 'asc')
      .execute();

    const meta = generateMeta(q, totalRecords);

    return { data, meta };
  },

  async readNotification(notifId: string, value: 1 | 0) {
    if (await this.checkNotifExists(notifId)) {
      await db.updateTable('account_notification').set({ is_read: value }).where('account_notification_id', '=', notifId).execute();
    }
  },

  async bulkReadNotifications(accountId: string) {
    await db.updateTable('account_notification').set({ is_read: 1 }).where('account_id', '=', accountId).execute();

    return true;
  },

  async sendNotification(accountId: string | string[], code: string, content?: Record<string, any>) {
    const data = [];

    if (Array.isArray(accountId)) {
      for (const id of accountId) {
        data.push({
          account_notification_id: IdGenerator.generateUUID(),
          account_id: id,
          code: code,
          content: JSON.stringify(content) ?? {},
          is_read: 0,
          created_at: generateDateNow(),
          updated_at: generateDateNow()
        });
      }
    } else {
      data.push({
        account_notification_id: IdGenerator.generateUUID(),
        account_id: accountId,
        code: code,
        content: JSON.stringify(content) ?? {},
        is_read: 0,
        created_at: generateDateNow(),
        updated_at: generateDateNow()
      });
    }

    await db.insertInto('account_notification').values(data).execute();

    return true;
  },

  async editAccount(accountId: string, data: updateAccount, file: Express.Multer.File | null = null) {
    const account = await this.findAccountById(accountId);

    const updateData = {
      account_email: data?.email,
      account_first_name: data?.first_name,
      account_last_name: data?.last_name,
      account_contact_number: data?.contact_number,
      account_status: data?.status,
    };

    try {
      if (file) {
        await deleteFile(account.account_image);
        const image = await uploadFile(generateAccountImageKey(), file);

        _.assign(updateData, { account_image: image?.file_key });
      }

      if (data.password) {
        _.assign(updateData, { account_password: await hashPassword(data.password) });
      }

      await db.updateTable('account').set(updateData).where('account_id', '=', accountId).execute();
    } catch (err) {
      logger.error('Error updating the account.', err);
      return;
    }

    return true;
  },

  async createAccountWithReferralCode(data: Record<string, string | any>) {
    let referral: Partial<ReferralCode> | any = null;

    if (data.referral_code) {
      referral = await referralCodeRepository.findAccountIdByReferralCode(data.referral_code);
    }

    const account = {
      account_id: IdGenerator.generateUUID(),
      account_email: data.email,
      account_password: await hashPassword(data.password),
      account_first_name: data.first_name,
      account_last_name: data.last_name,
      account_role: Role.DISTRIBUTOR,
      account_contact_number: data.contact_number,
      account_status: Status.PENDING,
      created_at: new Date(),
      updated_at: new Date()
    };

    if (data.contact_number) {
      await this.checkPhoneNumberExists(data.contact_number);
    }

    try {
      await db.insertInto('account').values(account).execute();
    } catch (error: any) {
      if (error.code === 'ER_DUP_ENTRY') {
        if (error.sqlMessage.includes('email_key')) {
          throw new AlreadyExistsException('Email already exists');
        } else {
          throw new AlreadyExistsException('Phone number already exists');
        }
      }
      throw error;
    }

    return { account, referral };
  },


  async addPaymentMethod(accountId: string, data: createPaymentMethod, file: Express.Multer.File) {
    const insertData = {
      account_payment_method_id: IdGenerator.generateUUID(),
      account_id: accountId,
      payment_method: data.method,
      payment_method_name: data.name,
      payment_method_number: data.number,
      payment_method_status: Status.ACTIVE,
      created_at: generateDateNow(),
      updated_at: generateDateNow()
    };

    try {
      if (file) {
        const image = await uploadFile(generatePaymentMethodKey(), file);

        _.assign(insertData, { payment_method_qr_code: image?.file_key });
      }

      await db.insertInto('account_payment_method').values(insertData).execute();
    } catch (err) {
      logger.error(err);
      throw new BadRequestException('Error creating payment method');
    }
  },


  async changePaymentMethod(accountId: string, data: updatePaymentMethod, file: Express.Multer.File) {
    const paymentMethod = await this.getPaymentMethod(accountId);

    const updateData = {
      payment_method: data?.method,
      payment_method_name: data?.name,
      payment_method_number: data?.number,
      payment_method_status: data?.status,
      updated_at: generateDateNow()
    };

    try {
      if (file) {
        await deleteFile(paymentMethod.payment_method_qr_code);
        const image = await uploadFile(generatePaymentMethodKey(), file);

        _.assign(updateData, { payment_method_qr_code: image?.file_key });
      }
      await db.updateTable('account_payment_method').set(updateData).where('account_id', '=', accountId).execute();
    } catch (err) {
      logger.error(err);

      throw new BadRequestException('Error updating payment method');
    }

    return true;
  },

  async topReferrals(accountId: string, q: QueryParams) {
    let defaultLimit = 10;

    if (q.limit) {
      defaultLimit = +q.limit;
    }

    const records = await db
      .selectFrom('account_referral as r')
      .leftJoin('account_referral as rf', 'r.account_id', 'rf.referred_by_id')
      .innerJoin('account as a', 'r.account_id', 'a.account_id')
      .select([
        'r.account_id as referral_account_id',
        sql<string>`CONCAT(a.account_first_name, ' ', a.account_last_name)`.as('account_name'),
        'a.account_email',
        'a.account_contact_number',
        'a.account_image',
        sql<number>`COUNT(rf.account_id)`.as('referrals_count')
      ])
      .where('r.referred_by_id', '=', accountId)
      .groupBy('r.account_id')
      .$call((eb) => applyLimit(eb, q))
      .execute();

    return records.map((record: Account | any) => {
      return {
        ...record,
        account_image: getImageUrl(record.account_image)
      };
    });
  },

  async topCommissions(accountId: string, q: QueryParams) {
    const records = await db
      .selectFrom('account_referral as r')
      .leftJoin('commission as c', 'r.account_id', 'c.account_id')
      .innerJoin('account as a', 'r.account_id', 'a.account_id')
      .select([
        'r.account_id',
        sql<string>`CONCAT(a.account_first_name, ' ', a.account_last_name)`.as('account_name'),
        'a.account_email',
        'a.account_contact_number',
        'a.account_image',
        sql<number>`COALESCE(SUM(c.commission_amount), 0)`.as('total_commission')
      ])
      .where('r.referred_by_id', '=', accountId)
      .groupBy('r.account_id')
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

  async getTickets(accountId: string, q: QueryParams, role: string) {
    return await ticketService.getTickets({ accountId: accountId, q: q, role: role });
  },

  async getAccountDetails(accountId: string) {
    const record = await db
      .selectFrom('account')
      .select([
        'account_id',
        'account_email',
        'account.account_role',
        sql<string>`CONCAT(account_first_name, ' ', account_last_name)`.as('account_name'),
        'account_image'
      ])
      .where('account_id', '=', accountId)
      .executeTakeFirstOrThrow(() => new NotFoundException('Account not found.'));

    return {
      ...record,
      account_image: getImageUrl(record.account_image)
    };
  },

  async getTeamMembersV2(accountId: string, q: QueryParams) {
    const { team_name, rank, total_gv } = await teamService.getTeamGVandRankV2({ accountId: accountId });

    const { data, meta } = await teamService.listTeamMembersV2(accountId, q);

    return { team_name, rank, total_gv, data, meta };
  },

  async getRanks() {
    return await db.selectFrom('ranks').select(['name', 'gv_req', 'pv_req']).orderBy('pv_req', 'asc').execute();
  },

  async insertAccountPV(accountId: string, pv: number) {
    await db
      .insertInto('account_pv')
      .values({
        account_pv_id: IdGenerator.generateUUID(),
        account_id: accountId,
        pv: String(pv),
        created_at: generateDateNow(),
        updated_at: generateDateNow()
      }).execute();
  },

  // async insertAccountPVV2(accountId: string, pv: number) {
  //   await db.transaction().execute(async (trx) => {
  //     const { startOfMonth, endOfMonth } = getCurrentMonthRange();
  //     const now = generateDateNow();
  //     const ranks = await teamService.getRanks();

  //     // 1️⃣ Insert the PV record
  //     await trx
  //       .insertInto('account_pv')
  //       .values({
  //         account_pv_id: IdGenerator.generateUUID(),
  //         account_id: accountId,
  //         pv: String(pv),
  //         created_at: now,
  //         updated_at: now,
  //       })
  //       .execute();

  //     // 2️⃣ Compute updated PV + GV + leg cap
  //     const rankData = await teamService.computePvAndGvWithLegCap(accountId, ranks as RankType[], startOfMonth, endOfMonth);

  //     if (!rankData) {
  //       logger.info(`No rank computed for account ${accountId}`);
  //       return;
  //     }

  //     // 3️⃣ Upsert the rank snapshot
  //     const existingSnapshot = await trx
  //       .selectFrom('ranks_snapshot')
  //       .select(['ranks_snapshot_id'])
  //       .where('account_id', '=', accountId)
  //       .executeTakeFirst();

  //     if (existingSnapshot) {
  //       await trx
  //         .updateTable('ranks_snapshot')
  //         .set({
  //           ranks_id: rankData.ranks_id,
  //           ranks_name: rankData.rankName,
  //           pv: String(rankData.pv),
  //           gv: String(rankData.gv),
  //           updated_at: now,
  //         })
  //         .where('account_id', '=', accountId)
  //         .execute();
  //     } else {
  //       await trx
  //         .insertInto('ranks_snapshot')
  //         .values({
  //           ranks_snapshot_id: IdGenerator.generateUUID(),
  //           account_id: accountId,
  //           ranks_id: rankData.ranks_id,
  //           ranks_name: rankData.rankName,
  //           pv: String(rankData.pv),
  //           gv: String(rankData.gv),
  //           created_at: now,
  //           updated_at: now,
  //         })
  //         .execute();
  //     }

  //     logger.info(`Auto-updated rank snapshot for ${accountId}: ${rankData.rankName}`);
  //   });
  // },

  async getDashboardStats(accountId: string) {
    const {
      grandTotalCommission,
      sumPackageCommission,
      sumProductCommission,
      sumLastMonthPackageCommission,
      sumLastMonthProductCommission,
      sumMonthlyPackageCommission,
      sumMonthlyProductCommission,
      totalCpq
    } = await commissionService.sumAllCommission(accountId);

    const teamName = await teamService.getTeamName(accountId);
    const ranks = await teamService.getRanks();
    const rank = await teamService.computePvAndGvWithLegCap(accountId, ranks as RankType[]);
    const rankName = rank?.ranks_name;
    const totalGv = rank?.capped_gv || 0;

    return {
      grandTotalCommission,
      sumPackageCommission,
      sumProductCommission,
      sumLastMonthPackageCommission,
      sumLastMonthProductCommission,
      sumMonthlyPackageCommission,
      sumMonthlyProductCommission,
      totalCpq,
      teamName,
      rankName,
      totalGv
    }
  },

  async updateAccountStatus(accountId: string, status: string) {
    await db
      .updateTable('account')
      .set({
        account_status: status,
        updated_at: generateDateNow()
      })
      .where('account_id', '=', accountId)
      .execute();
  },

  async getMaxCashoutPeraday() {
    return await findAppSettings(Settings.MAX_CASHOUT_PER_DAY);
  },

  async getReferralDetails(accountId: string) {
    return await db
      .selectFrom('account_referral as ar')
      .innerJoin('account as a', 'ar.account_id', 'a.account_id')
      .innerJoin('account as rb', 'ar.referred_by_id', 'rb.account_id')
      .select([
        'ar.referred_by_id',
        'rb.account_email',
        sql<string>`CONCAT(rb.account_first_name, ' ', rb.account_last_name)`.as('account_name')
      ])
      .where('a.account_id', '=', accountId)
      .executeTakeFirst();
  },

  async resetPassword(accountId: string, oldPassword: string, newPassword: string) {
    const account = await db.selectFrom('account as a')
      .select([
        'a.account_password'
      ])
      .where('a.account_id', '=', accountId)
      .executeTakeFirst();

    if (! await comparePassword(oldPassword, account?.account_password ?? '')) {
      throw new BadRequestException('Old password does not match.');
    }

    await dbClient.updateTable('account')
      .set({
        account_password: await hashPassword(newPassword)
      })
      .where('account_id', '=', accountId)
      .execute();

    return true;
  },

  async getCurrentPv(accountId: string) {
    const { startOfMonth, endOfMonth } = getCurrentMonthRange();

    const result = await db.selectFrom('account_pv as apv')
      .innerJoin('account as a', 'apv.account_id', 'a.account_id')
      .select(sql<number>`COALESCE(SUM(apv.pv), 0)`.as('total_pv'))
      .where('apv.account_id', '=', accountId)
      .where('apv.created_at', '>=', startOfMonth)
      .where('apv.created_at', '<=', endOfMonth)
      .executeTakeFirst();

    return result?.total_pv ?? 0;
  },

  async getPaymentMethod(accountId: string) {
    const data = await db
      .selectFrom('account_payment_method')
      .selectAll()
      .where('account_id', '=', accountId)
      .executeTakeFirstOrThrow(() => new NotFoundException('Payment method not found.'));

    return {
      ...data,
      payment_method_qr_code: getImageUrl(data.payment_method_qr_code)
    };
  },

  async checkNotifExists(notifId: string) {
    const results = await db.selectFrom('account_notification').selectAll().where('account_notification_id', '=', notifId).executeTakeFirst();

    return !!results;
  },

  async findAccountById(accountId: string) {
    return await db
      .selectFrom('account')
      .selectAll()
      .where('account_id', '=', accountId)
      .executeTakeFirstOrThrow(() => new BadRequestException('Account not found.'));
  },

  async hasChatMessage(accountId: string) {
    const chatIds = await chatService.getChatIds(accountId);

    if (_.isEmpty(chatIds)) {
      return false;
    }

    const data = await db.selectFrom('chat_messages as cm')
      .innerJoin('chat as c', 'cm.chat_id', 'c.chat_id')
      .select([
        'cm.chat_id'
      ])
      .where('cm.sender_id', '!=', accountId)
      .where('cm.chat_id', 'in', chatIds)
      .where('cm.is_read', '=', 0)
      .where('c.chat_type', '=', Chat.TYPE_PEER)
      .executeTakeFirst();

    if (!_.isEmpty(data)) {
      return true;
    }

    return false;
  },

  async hasOrderUpdate(accountId: string) {
    const data = await db.selectFrom('order as o')
      .selectAll()
      .where('o.account_id', '=', accountId)
      .$call((qb: any) => filterByApprovedOrReady(qb))
      .executeTakeFirst();

    if (!_.isEmpty(data)) {
      return true;
    }

    return false;
  },

  async sidebarStatus(accountId: string) {
    return {
      'has_chat_msg': await this.hasChatMessage(accountId),
      'has_order_update': await this.hasOrderUpdate(accountId),
    }
  },

  async checkPhoneNumberExists(contactNumber: string) {
    const data = await db.selectFrom('account')
      .select(['account_id'])
      .where('account_contact_number', '=', contactNumber)
      .executeTakeFirst();

    if (!_.isEmpty(data)) {
      throw new AlreadyExistsException('Phone number already exists');
    }

    return;
  }
}
