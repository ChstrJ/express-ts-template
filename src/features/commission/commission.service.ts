import db from 'src/db/db-client';
import { sql } from 'kysely';
import { IdGenerator } from '@utils/id-generator';
import { Status } from '@common/constants/status';
import { networkTreeService } from '@features/network-tree/network-tree.service';
import _ from 'lodash';
import { getCurrentMonthRange, getCutoffRange, getLastMonthRange, getLastWeekRange, getMonthRange } from '@utils/date';
import { Commission } from '@common/constants/commission';
import { dd, formatName, generateDateNow } from '@utils/helpers';
import { adminService } from '@features/admin/admin.service';
import { BadRequestException } from '@utils/errors';
import { applyPagination, generateMeta, getTotalRecords, QueryParams } from '@utils/pagination';
import { applySearch } from '@utils/search';
import logger from '@utils/logger';
import { EmailJob } from 'src/jobs/email';
import { EmailType } from '@common/constants/email';
import { MonthlySnapshot, RankType, ReferralCommissionRecord } from '@utils/types';
import dayjs from 'dayjs';
import { teamService } from '@features/team/team.service';
import { walletService } from '@features/wallet/wallet.service';
import { AlertJob } from 'src/jobs/alert';
import { NotifCode } from '@common/constants/notifs-code';
import { salesService } from '@features/sales/sales.service';
import { Rank } from '@common/constants/rank';
import { BonusJob } from 'src/jobs/bonus';
import { JobType } from '@common/constants/job';
import { Cron } from '@common/constants/cron';

export const commissionService = {
  async listAllCommission(q: QueryParams) {
    const baseQuery = db
      .selectFrom('commission as c')
      .leftJoin('account as a', 'a.account_id', 'c.account_id')

    const totalRecords = await getTotalRecords(baseQuery);

    const data = await baseQuery
      .select([
        'c.commission_id',
        'a.account_id',
        'a.account_first_name',
        'c.commission_amount',
        'c.commission_status',
        'c.released_at',
        'c.created_at',
        'c.updated_at'
      ])
      .execute();

    const meta = generateMeta(q, totalRecords);

    return { data, meta };
  },

  async listAccountCommission(accountId: string, q: QueryParams) {
    const baseQuery = db
      .selectFrom('commission as c')
      .leftJoin('account as a', 'c.transaction_account_id', 'a.account_id')
      .innerJoin('account_product_package as app', 'a.account_id', 'app.account_id')
      .innerJoin('product_package as pp', 'app.product_package_id', 'pp.product_package_id')
      .where('c.account_id', '=', accountId)

    const totalRecords = await getTotalRecords(baseQuery);

    const data = await baseQuery
      .select([
        'c.commission_id',
        'c.transaction_account_id as referee_id',
        sql`CONCAT(a.account_first_name, ' ', a.account_last_name)`.as('referee_name'),
        'c.commission_amount',
        'c.commission_status',
        'c.commission_type',
        'pp.product_package_name',
        'c.released_at',
        'c.created_at',
        'c.updated_at'
      ])
      .$call((qb) => applyPagination(qb, q))
      .$call((eb: any) => applySearch(eb, q, 'a', ['account_first_name', 'account_last_name']))
      .orderBy('c.created_at', 'desc')
      .execute();

    const meta = generateMeta(q, totalRecords);

    return { data, meta };
  },

  async sumAllCommission(accountId: string) {
    const { startOfLastMonth, endOfLastMonth } = getLastMonthRange();
    const { startOfMonth, endOfMonth } = getCurrentMonthRange();

    const result = await db
      .selectFrom('commission as c')
      .select(() => [
        sql<number>`
      SUM(
        CASE WHEN c.commission_type = ${Commission.TYPE_PACKAGE} 
          AND c.commission_status = ${Status.RELEASED} 
        THEN c.commission_amount ELSE 0 END
      )`.as('total_package_commission'),
        sql<number>`
      SUM(
        CASE WHEN  
          (c.commission_status = ${Status.UNRELEASED} OR c.commission_status = ${Status.ON_HOLD})
          AND c.created_at >= ${startOfMonth} 
          AND c.created_at <= ${endOfMonth} 
        THEN c.commission_amount ELSE 0 END
      )`.as('total_cpq'),
        sql<number>`
      SUM(
        CASE WHEN c.commission_type = ${Commission.TYPE_PRODUCT} 
          AND c.commission_status = ${Status.RELEASED} 
        THEN c.commission_amount ELSE 0 END
      )`.as('total_product_commission'),
        sql<number>`
      SUM(
        CASE WHEN c.commission_type = ${Commission.TYPE_PACKAGE} 
          AND c.commission_status = ${Status.RELEASED} 
          AND c.created_at >= ${startOfLastMonth} 
          AND c.created_at <= ${endOfLastMonth} 
        THEN c.commission_amount ELSE 0 END
      )`.as('last_month_package_commission'),
        sql<number>`
      SUM(
        CASE WHEN c.commission_type = ${Commission.TYPE_PRODUCT} 
          AND c.commission_status = ${Status.RELEASED} 
          AND c.created_at >= ${startOfLastMonth} 
          AND c.created_at <= ${endOfLastMonth} 
        THEN c.commission_amount ELSE 0 END
      )`.as('last_month_product_commission'),
        sql<number>`
      SUM(
        CASE WHEN c.commission_type = ${Commission.TYPE_PRODUCT} 
          AND c.commission_status = ${Status.RELEASED} 
          AND c.created_at >= ${startOfMonth} 
          AND c.created_at <= ${endOfMonth} 
        THEN c.commission_amount ELSE 0 END
      )`.as('monthly_product_commission'),
        sql<number>`
      SUM(
        CASE WHEN c.commission_type = ${Commission.TYPE_PACKAGE} 
          AND c.commission_status = ${Status.RELEASED} 
          AND c.created_at >= ${startOfMonth} 
          AND c.created_at <= ${endOfMonth} 
        THEN c.commission_amount ELSE 0 END
      )`.as('monthly_package_commission'),
      ])
      .where('c.account_id', '=', accountId)
      .executeTakeFirst();

    const sumPackageCommission = +(result?.total_package_commission ?? 0);
    const sumProductCommission = +(result?.total_product_commission ?? 0);
    const sumLastMonthPackageCommission = +(result?.last_month_package_commission ?? 0);
    const sumLastMonthProductCommission = +(result?.last_month_product_commission ?? 0);
    const sumMonthlyPackageCommission = +(result?.monthly_package_commission ?? 0);
    const sumMonthlyProductCommission = +(result?.monthly_product_commission ?? 0);
    const totalCpq = +(result?.total_cpq ?? 0);

    const grandTotalCommission = +(sumPackageCommission + sumProductCommission).toFixed(2);

    return {
      grandTotalCommission,
      sumPackageCommission,
      sumProductCommission,
      sumLastMonthPackageCommission,
      sumLastMonthProductCommission,
      sumMonthlyPackageCommission,
      sumMonthlyProductCommission,
      totalCpq
    };
  },

  async getGrandTotalCommission() {
    const result = await db
      .selectFrom('commission as c')
      .select(() => [
        sql<number>`SUM(
        CASE WHEN c.commission_type = ${Commission.TYPE_PACKAGE} 
        AND c.commission_status = ${Status.RELEASED} 
        THEN c.commission_amount ELSE 0 END)`.as('total_package_commission'),
        sql<number>`SUM(
        CASE WHEN c.commission_type = ${Commission.TYPE_PRODUCT} 
        AND c.commission_status = ${Status.RELEASED}
        THEN c.commission_amount ELSE 0 END)`.as('total_product_commission'),
        sql<number>`SUM(
        CASE WHEN c.commission_status = ${Status.ON_HOLD} 
        THEN c.commission_amount ELSE 0 END)`.as('total_cpq'),
      ])
      .executeTakeFirst();

    const sumPackageCommission = +(result?.total_package_commission ?? 0);
    const sumProductCommission = +(result?.total_product_commission ?? 0);

    return {
      grandTotalCommission: sumPackageCommission + sumProductCommission,
      totalCPQ: +(result?.total_cpq ?? 0).toFixed(2)
    }
  },

  prepareCommissionData(data: any, commissionType: string) {
    const commissionData = {
      commission_id: IdGenerator.generateUUID(),
      account_id: data.referrer_id,
      transaction_account_id: data.referee_id,
      commission_amount: data.commission_amount,
      commission_status: Status.UNRELEASED,
      commission_type: commissionType,
      created_at: new Date(),
      updated_at: new Date()
    };

    return commissionData;
  },

  prepareHistoryData(data: any, commissionType: string) {
    const historyData = {
      account_id: data.referrer_id,
      referee_id: data.referee_id,
      referee_name: data.referee_name,
      commission_amount: data.commission_amount,
      wallet_transaction_title: '',
      total_pv: data.total_pv,
    };

    const refereeName = data.referee_name ? data.referee_name : '';

    if (commissionType === Commission.TYPE_PACKAGE) {
      historyData.wallet_transaction_title = `Referee: ${refereeName}, from Package Commission, Package: ${data.product_package_name}`;
    } else {
      historyData.wallet_transaction_title = `Referee: ${refereeName}, from Product Commission`;
    }

    return historyData;
  },

  async computeCommission(accountId: string, commissionType: string, salesAmount: number) {
    const ranks = await adminService.getRankSettings();
    const uplines = await networkTreeService.getUplines(accountId);
    const rates = await adminService.listLevels();

    if (_.isEmpty(ranks) || _.isEmpty(rates) || _.isEmpty(uplines)) {
      return;
    }

    const ratesMap = new Map(rates.map(r => [r.commission_level, Number(r?.commission_percentage)]));

    if (_.isEmpty(uplines)) {
      logger.info(`No uplines for ${accountId}.`);
      return;
    }

    await db.transaction().execute(async (trx) => {
      const commissionData = [];
      const walletTransactionData = [];
      for (const upline of uplines) {
        const uplineAccountId = upline.account_id;
        const uplineLevel = upline.level;
        const rank = await teamService.computePvAndGvWithLegCap(uplineAccountId, ranks as RankType[]);

        const rankLevel = rank?.level;
        const bonus = rank?.bonus;

        let commissionStatus = rank?.ranks_name === 'unranked' ? Status.ON_HOLD : Status.RELEASED;

        if (uplineLevel > rankLevel) {
          commissionStatus = Status.ON_HOLD;
        }

        const totalRate = (ratesMap.get(upline.level) ?? 0) + bonus;
        const commissionAmount = ((Number(salesAmount) * totalRate) / 100).toFixed(2);

        commissionData.push({
          commission_id: IdGenerator.generateUUID(),
          account_id: uplineAccountId,
          transaction_account_id: accountId,
          commission_amount: commissionAmount,
          commission_status: commissionStatus,
          commission_type: commissionType,
          created_at: generateDateNow(),
          released_at: commissionStatus === Status.RELEASED ? generateDateNow() : null,
          updated_at: generateDateNow(),
        });

        if (commissionStatus === Status.RELEASED) {
          const walletId = await walletService.getWalletId(uplineAccountId);
          await walletService.incrementWalletWithTransaction(uplineAccountId, commissionAmount, trx);

          walletTransactionData.push({
            wallet_transaction_id: IdGenerator.generateUUID(),
            wallet_id: walletId,
            withdrawal_id: null,
            wallet_transaction_amount: commissionAmount,
            wallet_transaction_type: Status.IN,
            wallet_transaction_status: Status.COMPLETED,
            wallet_transaction_title: `Commission from ${commissionType}`,
            created_at: generateDateNow(),
            updated_at: generateDateNow(),
          });
        }
      }

      if (!_.isEmpty(commissionData)) {
        await trx.insertInto('commission').values(commissionData).execute();
      }

      if (!_.isEmpty(walletTransactionData)) {
        await trx.insertInto('wallet_transaction').values(walletTransactionData).execute();
      }
    });

    return true;
  },

  async disburseCommissionWithinTransaction(
    accountId: string,
    commissionType: string = Commission.TYPE_PACKAGE,
    trx: any,
    orderId: string = ''
  ) {
    let commissionData: ReferralCommissionRecord[] = [];

    if (commissionType === Commission.TYPE_PACKAGE) {
      commissionData = await networkTreeService.referralChainForPackageCommissionV2(accountId);
    } else {
      commissionData = await networkTreeService.referralChainForProductCommissionV2(accountId, orderId);
    }

    if (_.isEmpty(commissionData)) {
      return;
    }

    // const requiredPv = await adminService.getRequiredPv();

    // if (!requiredPv || isNaN(Number(requiredPv))) {
    //   throw new BadRequestException('Required PV is not set properly in settings.');
    // }

    // for (const data of commissionData) {
    //   const totalPv = Number(data.total_pv) || 0;

    //   const isPVMet = totalPv >= Number(requiredPv);

    //   if (!isPVMet) {
    //     continue;
    //   }

    //   await CommissionJob.addToQueue({
    //     type: JobType.UNRELEASED_COMMISSION,
    //     payload: {
    //       account_id: data.referrer_id,
    //       total_pv: totalPv
    //     }
    //   })
    // }

    // const formattedHistoryData = commissionData.map((data) => this.prepareHistoryData(data, commissionType));

    // const accountIds = formattedCommissionData.map((data) => data.account_id);

    // Find existing wallet by account ids
    // const walletIds = await walletService.findWalletsByAccountIds(accountIds);

    // We check if the required pv is met before updating the wallet
    // const walletsToUpdate = formattedHistoryData.filter(
    //   (data) => data.total_pv >= requiredPv
    // );

    // if (walletsToUpdate.length > 0) {
    //   let transactionHistoryData = [];

    //   for (const data of walletsToUpdate) {
    //     const walletId = walletIds.get(data?.account_id);

    //     let historyData = {
    //       wallet_transaction_id: IdGenerator.generateUUID(),
    //       wallet_id: walletId,
    //       withdrawal_id: null,
    //       wallet_transaction_amount: data?.commission_amount.toFixed(2),
    //       wallet_transaction_type: Status.IN,
    //       wallet_transaction_status: Status.COMPLETED,
    //       wallet_transaction_title: data?.wallet_transaction_title,
    //       created_at: generateDateNow(),
    //       updated_at: generateDateNow()
    //     }

    //     transactionHistoryData.push(historyData);
    //   }

    //   await walletService.bulkUpdateWallets(walletsToUpdate, trx);
    //   await walletService.bulkCreateHistory(transactionHistoryData, trx);
    // }
    const formattedCommissionData = commissionData.map((data) => this.prepareCommissionData(data, commissionType));

    await trx.insertInto('commission').values(formattedCommissionData).execute();
  },

  async disburseCommission(accountId: string, commissionType: string, orderId: string = '') {
    await db.transaction().execute(async (trx) => {
      await this.disburseCommissionWithinTransaction(accountId, commissionType, trx, orderId);
    });
  },

  async disburseMonthlyCommission() {
    const { startOfMonth, endOfMonth } = getCurrentMonthRange();

    const pv = await db
      .selectFrom('account_pv')
      .selectAll()
      .where('created_at', '>=', startOfMonth)
      .where('created_at', '<=', endOfMonth)
      .execute();
  },

  async voidCommissions() {
    logger.info('Start void commissions...')
    const { startOfLastMonth, endOfLastMonth } = getLastMonthRange();

    const commissions = await db.selectFrom('commission as c')
      .select([
        'c.commission_id',
      ])
      .where('c.commission_status', '=', Status.ON_HOLD)
      .where('created_at', '>=', startOfLastMonth)
      .where('created_at', '<=', endOfLastMonth)
      .execute();

    const commissionsToVoid = commissions.map(c => c.commission_id);

    if (!_.isEmpty(commissionsToVoid)) {
      await db
        .updateTable('commission')
        .set({ commission_status: Status.VOID })
        .where('commission_id', 'in', commissionsToVoid)
        .execute();
    }

    logger.info('Commission status updated to VOID for underperforming accounts.');
    return 'Success';
  },

  async disburseUnreleasedCommissionByAccount(accountId: string, totalPv: number = 0) {
    const { startOfMonth, endOfMonth } = getCurrentMonthRange();

    // Get unreleased commission for this account
    const commissionRecord = await db
      .selectFrom('commission')
      .select(sql<number>`COALESCE(SUM(commission_amount), 0)`.as('amount'))
      .where('account_id', '=', accountId)
      .where('created_at', '>=', startOfMonth)
      .where('created_at', '<=', endOfMonth)
      .where('commission_status', '=', Status.UNRELEASED)
      .executeTakeFirst();

    const amount = commissionRecord?.amount ?? 0;

    // If no unreleased commission found, return early
    if (amount <= 0 || _.isEmpty(commissionRecord)) {
      logger.info(`No unreleased commission found for account ${accountId}`);
      return;
    }

    // Proceed with release
    const account = await db
      .selectFrom('account as a')
      .innerJoin('wallet as w', 'a.account_id', 'w.account_id')
      .select([
        'a.account_email',
        'a.account_first_name',
        'a.account_last_name',
        'w.wallet_id',
      ])
      .where('a.account_id', '=', accountId)
      .executeTakeFirst();

    if (!account) {
      logger.error(`Account not found or missing wallet: ${accountId}`);
      return;
    }

    // Start transaction
    await db.transaction().execute(async (trx) => {
      // 1. Update commission status → RELEASED
      await trx
        .updateTable('commission')
        .set({ commission_status: Status.RELEASED })
        .where('account_id', '=', accountId)
        .where('created_at', '>=', startOfMonth)
        .where('created_at', '<=', endOfMonth)
        .where('commission_status', '=', Status.UNRELEASED)
        .execute();

      // 2. Increment wallet amount
      await trx
        .updateTable('wallet')
        .set({ wallet_amount: sql`wallet_amount + ${amount}` })
        .where('account_id', '=', accountId)
        .execute();

      // 3. Insert wallet transaction history
      await trx
        .insertInto('wallet_transaction')
        .values({
          wallet_transaction_id: IdGenerator.generateUUID(),
          wallet_id: account.wallet_id,
          withdrawal_id: null,
          wallet_transaction_amount: String(amount),
          wallet_transaction_type: Status.IN,
          wallet_transaction_status: Status.COMPLETED,
          wallet_transaction_title: 'Unreleased commission from last month.',
          created_at: generateDateNow(),
          updated_at: generateDateNow(),
        })
        .execute();

      // 4. Send Email notification
      await EmailJob.addToQueue({
        type: EmailType.UNRELEASED_COMMISSION_EMAIL,
        payload: {
          to: account.account_email,
          amount: amount,
          account_name: formatName(account.account_first_name, account.account_last_name),
        },
      });
    });

    logger.info(`Successfully released unreleased commissions for account ${accountId}`);
    return 'Success';
  },

  async computeCommissionByAccount(accountId: string, sourceId: string, commissionType: string, salesAmount: number) {
    const ranks = await adminService.getRankSettings();
    const { startOfMonth, endOfMonth } = getCurrentMonthRange();

    if (_.isEmpty(ranks)) return;

    const pvs = await networkTreeService.getDownlinesPV(accountId, startOfMonth, endOfMonth);

    const currentAccountPv = pvs[0]?.total_pv || 0;
    let gvTotal = 0;

    for (const pv of pvs) {
      if (pv.total_pv === 0) continue;
      gvTotal += Number(pv.total_pv);
    }

    const achievedRank = ranks
      .filter(function(rank) {
        const pvReq = rank.pv_req ?? 0;
        const gvReq = Number(rank.gv_req ?? 0);

        return currentAccountPv >= pvReq && gvTotal >= gvReq;
      })
      .sort((a, b) => Number(b.pv_req) - Number(a.pv_req))[0];

    console.log(achievedRank);

    let rankRate, rankName;
    if (!achievedRank) {
      // For unranked, we based on the bronze rate
      const rank = ranks.find(rank => rank.name === 'bronze');
      if (!rank) {
        throw new BadRequestException('Bronze rank settings not found.');
      }
      rankRate = rank?.meta;
      rankName = rank?.name;
      logger.info(`Account ${accountId} is unranked. Using bronze rate.`);
    } else {
      rankRate = achievedRank.meta;
      rankName = achievedRank.name;
    }

    if (!rankRate) {
      logger.error(`No rank rate found for account ${accountId}. Commission calculation stopped.`);
      return;
    }

    const uplines = await networkTreeService.getUplines(accountId);

    console.log(uplines);

    if (_.isEmpty(uplines)) return;

    const toInsertCommissions = [];
    for (const upline of uplines) {
      const levelRate = rankRate.find((r: any) => r.level === upline.level);
      const rate = Number(levelRate?.rate) || 0;

      if (rate === 0) {
        logger.info(`Commission Rate is 0 for account: ${upline.account_id}, skipping...`);
        continue;
      }

      const commissionAmount = ((salesAmount * rate) / 100).toFixed(2);

      toInsertCommissions.push({
        commission_id: IdGenerator.generateUUID(),
        commission_status: Status.UNRELEASED,
        account_id: upline.account_id,
        transaction_account_id: sourceId,
        commission_amount: commissionAmount,
        commission_type: commissionType,
        created_at: generateDateNow(),
        updated_at: generateDateNow(),
      })
    }

    if (!_.isEmpty(toInsertCommissions)) {
      await db.insertInto('commission').values(toInsertCommissions).execute();
    }
  },

  async releaseOnHoldCommissions(ranks: RankType[], startDate: Date, endDate: Date) {
    const onHoldCommissions = await db.selectFrom('commission as c')
      .innerJoin('account as a', 'c.account_id', 'a.account_id')
      .innerJoin('wallet as w', 'a.account_id', 'w.account_id')
      .select([
        'c.commission_id',
        'c.transaction_account_id',
        'c.account_id',
        'w.wallet_id',
        'a.account_email',
        'a.account_first_name',
        'a.account_last_name',
        'c.commission_amount',
        'c.commission_type',
      ])
      .where('c.commission_status', '=', Status.ON_HOLD)
      .where('c.created_at', '>=', startDate)
      .where('c.created_at', '<=', endDate)
      .execute();

    if (_.isEmpty(onHoldCommissions)) {
      logger.info('No on-hold commissions to release.');
      return;
    }

    const ranksMap = new Map(ranks.map(r => [r.ranks_id, r]));
    const commissionsByTransactionAccount = _.groupBy(onHoldCommissions, 'transaction_account_id');

    const allUplineIds = Object.values(commissionsByTransactionAccount)
      .flat()
      .map(c => c.account_id);

    const snapshots = await teamService.getRankSnapshot(allUplineIds);
    const snapshotMap = new Map(snapshots.map(s => [s.account_id, s]));

    await db.transaction().execute(async (trx) => {
      const commissionIdsToRelease: string[] = [];
      const toInsertWalletTransactions = [];

      for (const transactionAccountId in commissionsByTransactionAccount) {
        const commissions = commissionsByTransactionAccount[transactionAccountId];
        const uplines = await networkTreeService.getUplines(transactionAccountId);
        const uplinesMap = new Map(uplines.map(u => [u.account_id, u]));

        for (const commission of commissions) {
          const upline = uplinesMap.get(commission.account_id);

          if (!upline) {
            logger.info(`Upline ${commission.account_id} not found for transaction account ${transactionAccountId}`);
            continue;
          }

          const snapshot = snapshotMap.get(upline.account_id);

          if (snapshot?.ranks_name === 'unranked' || !snapshot) {
            logger.info(`Account still unranked: ${upline.account_id}, skipping...`);
            continue;
          }

          const rank = ranksMap.get(snapshot?.ranks_id ?? '');
          const maxLevel = rank?.meta.max_levels ?? 0;
          const minLevel = rank?.meta.min_levels ?? 0;

          if (upline.level >= minLevel && upline.level <= maxLevel) {
            commissionIdsToRelease.push(commission.commission_id);
            await walletService.incrementWalletWithTransaction(commission.account_id, String(commission.commission_amount), trx);

            toInsertWalletTransactions.push({
              wallet_transaction_id: IdGenerator.generateUUID(),
              wallet_id: commission.wallet_id,
              withdrawal_id: null,
              wallet_transaction_amount: String(commission.commission_amount),
              wallet_transaction_type: Status.IN,
              wallet_transaction_status: Status.COMPLETED,
              wallet_transaction_title: 'Released on-hold commission',
              created_at: generateDateNow(),
              updated_at: generateDateNow(),
            });

            await AlertJob.addToQueue({
              code: NotifCode.COMMISSION_RELEASED,
              ids: commission.account_id,
            })
          } else {
            logger.info(`Commission: ${commission.commission_id}`);
            logger.info(
              `Account ${upline.account_id} — Upline Level: ${upline.level}, Rank ${rank?.name} only allows from level ${minLevel} to ${maxLevel}. Needs higher rank to release.`
            );
          }
        }
      }

      if (commissionIdsToRelease.length > 0) {
        logger.info(`Releasing ${commissionIdsToRelease.length} commissions...`);
        await trx.updateTable('commission')
          .set({ commission_status: Status.RELEASED, released_at: generateDateNow() })
          .where('commission_id', 'in', commissionIdsToRelease)
          .execute();
      }

      if (toInsertWalletTransactions.length > 0) {
        logger.info(`Inserting ${toInsertWalletTransactions.length} history transactions...`);
        await trx.insertInto('wallet_transaction').values(toInsertWalletTransactions).execute();
      }
    });

    logger.info('Done releasing commissions.');
    return true;
  },

  async releaseBonus(ranks: RankType[], startDate: Date, endDate: Date, testMode: boolean = false) {
    const accounts = await teamService.getMonthlyRankSnapshot(testMode);

    if (_.isEmpty(accounts)) {
      logger.info('No high ranks found.')
      return;
    }

    const golds = []
    const platinums = []
    const diamonds = []
    for (const account of accounts) {
      if (account.ranks_name === Rank.GOLD) {
        golds.push(account);
      }

      if (account.ranks_name === Rank.PLATINUM) {
        platinums.push(account);
      }

      if (account.ranks_name === Rank.DIAMOND) {
        diamonds.push(account);
      }
    }

    if (golds.length > 0) {
      logger.info(`Found ${golds.length} gold accounts.`);

      await BonusJob.addToQueueWithPriority({
        type: JobType.PROCESS_GOLD,
        payload: {
          accounts: golds,
          ranks: ranks,
          startDate: startDate,
          endDate: endDate,
        }
      }, Cron.HIGH_PRIORITY)
    }

    if (platinums.length > 0) {
      logger.info(`Found ${platinums.length} platinum accounts.`);

      await BonusJob.addToQueueWithPriority({
        type: JobType.PROCESS_PLATINUM,
        payload: {
          accounts: platinums,
          ranks: ranks,
          startDate: startDate,
          endDate: endDate,
        }
      }, Cron.HIGH_PRIORITY)
    }

    if (diamonds.length > 0) {
      logger.info(`Found ${diamonds.length} diamond accounts.`);

      await BonusJob.addToQueueWithPriority({
        type: JobType.PROCESS_DIAMOND,
        payload: {
          accounts: diamonds,
          ranks: ranks,
          startDate: startDate,
          endDate: endDate,
        }
      }, Cron.HIGH_PRIORITY)
    }

    return true;
  },

  async processGoldBonus(golds: MonthlySnapshot[], ranks: RankType[], startDate: Date, endDate: Date) {
    logger.info(`Found ${golds.length} gold accounts.`);

    const rank = ranks.find(r => r.name === Rank.GOLD);

    if (!rank) {
      return;
    }

    const bonus = rank?.meta.group_bonus ?? 0;

    const toInsertWalletTransactions = [];
    for (const gold of golds) {
      const accountId = gold.account_id;

      // Get only the level 1 downline
      const downlines = await networkTreeService.getDownlines(accountId);
      let levelOneAccountId = '';
      for (const downline of downlines) {
        if (downline.level === 1) {
          levelOneAccountId = downline.account_id;
          break;
        }
      }

      // Get total sales from level one downline
      const sales = await salesService.getTotalSalesAmountByAccount(levelOneAccountId, startDate, endDate);

      // Compute bonus amount
      const bonusAmount = (sales * (bonus / 100)).toFixed(2);

      // Increment wallet
      await walletService.incrementWallet(accountId, bonusAmount);

      // Push history records
      toInsertWalletTransactions.push({
        wallet_transaction_id: IdGenerator.generateUUID(),
        wallet_id: gold.wallet_id,
        withdrawal_id: null,
        wallet_transaction_amount: bonusAmount,
        wallet_transaction_type: Status.IN,
        wallet_transaction_status: Status.COMPLETED,
        wallet_transaction_title: `End of the month bonus`,
        created_at: generateDateNow(),
        updated_at: generateDateNow(),
      })

      await AlertJob.addToQueue({
        code: NotifCode.BONUS_RELEASED,
        ids: gold.account_id,
      })
    }

    if (toInsertWalletTransactions.length > 0) {
      await db.insertInto('wallet_transaction').values(toInsertWalletTransactions).execute();
    }

    logger.info('Successfully released bonuses for gold ranks.');
  },

  async processPlatinumBonus(platinums: MonthlySnapshot[], ranks: RankType[], startDate: Date, endDate: Date) {
    logger.info(`Found ${platinums.length} platinum accounts.`);

    const rank = ranks.find(r => r.name === Rank.PLATINUM);

    if (!rank) {
      return;
    }

    const bonus = rank?.meta.group_bonus ?? 0;

    const toInsertWalletTransactions = [];
    for (const platinum of platinums) {
      const accountId = platinum.account_id;

      const downlines = await networkTreeService.getDownlines(accountId);
      const downlinesAccountIds = downlines.map(d => d.account_id);

      // Get total sales from all the downlines 1-5
      const sales = await salesService.getTotalSalesAmountByAccount(downlinesAccountIds, startDate, endDate);

      // Compute bonus amount
      const bonusAmount = (sales * (bonus / 100)).toFixed(2);

      // Increment wallet
      await walletService.incrementWallet(accountId, bonusAmount);

      // Push history records
      toInsertWalletTransactions.push({
        wallet_transaction_id: IdGenerator.generateUUID(),
        wallet_id: platinum.wallet_id,
        withdrawal_id: null,
        wallet_transaction_amount: bonusAmount,
        wallet_transaction_type: Status.IN,
        wallet_transaction_status: Status.COMPLETED,
        wallet_transaction_title: `End of the month bonus`,
        created_at: generateDateNow(),
        updated_at: generateDateNow(),
      })

      await AlertJob.addToQueue({
        code: NotifCode.BONUS_RELEASED,
        ids: platinum.account_id,
      })
    }

    if (toInsertWalletTransactions.length > 0) {
      await db.insertInto('wallet_transaction').values(toInsertWalletTransactions).execute();
    }

    logger.info('Successfully released bonuses for platinum ranks.');
  },

  async processDiamondBonus(diamonds: MonthlySnapshot[], ranks: RankType[], startDate: Date, endDate: Date) {
    logger.info(`Found ${diamonds.length} diamond accounts.`);

    const rank = ranks.find(r => r.name === Rank.DIAMOND);

    if (!rank) {
      return;
    }

    const companySales = await salesService.getTotalSalesAmount(startDate, endDate);

    const groupBonusRate = rank?.meta.group_bonus ?? 0;
    const companyBonusRate = rank?.meta.company_bonus ?? 0;

    const companyBonus = Number((companySales * (companyBonusRate / 100)).toFixed(2));

    let totalDiamondGv = 0;
    for (const diamond of diamonds) {
      totalDiamondGv += Number(diamond.gv);
    }

    const toInsertWalletTransactions = [];
    for (const diamond of diamonds) {
      const accountId = diamond.account_id;

      const downlines = await networkTreeService.getDownlines(accountId);
      const downlinesAccountIds = downlines.map(d => d.account_id);

      // Get total sales from all the downlines 1-5
      const downlinesSales = await salesService.getTotalSalesAmountByAccount(downlinesAccountIds, startDate, endDate);

      // Compute bonus
      const groupBonusAmount = Number((downlinesSales * (groupBonusRate / 100)).toFixed(2));

      // Compute diamond rate
      const diamondRate = Number((Number(diamond.gv) / totalDiamondGv).toFixed(4));

      // Prorated company bonus based on their GV
      const adjustedCompanyBonus = Number((diamondRate * companyBonus).toFixed(2));

      const totalWalletAmount = groupBonusAmount + adjustedCompanyBonus;

      // Increment wallet amount
      await walletService.incrementWallet(accountId, totalWalletAmount);

      // Push history records
      toInsertWalletTransactions.push({
        wallet_transaction_id: IdGenerator.generateUUID(),
        wallet_id: diamond.wallet_id,
        withdrawal_id: null,
        wallet_transaction_amount: String(groupBonusAmount),
        wallet_transaction_type: Status.IN,
        wallet_transaction_status: Status.COMPLETED,
        wallet_transaction_title: `End of the month bonus`,
        created_at: generateDateNow(),
        updated_at: generateDateNow(),
      })

      toInsertWalletTransactions.push({
        wallet_transaction_id: IdGenerator.generateUUID(),
        wallet_id: diamond.wallet_id,
        withdrawal_id: null,
        wallet_transaction_amount: String(adjustedCompanyBonus),
        wallet_transaction_type: Status.IN,
        wallet_transaction_status: Status.COMPLETED,
        wallet_transaction_title: `Company product sales bonus`,
        created_at: generateDateNow(),
        updated_at: generateDateNow(),
      })

      await AlertJob.addToQueue({
        code: NotifCode.BONUS_RELEASED,
        ids: diamond.account_id,
      })
    }

    if (toInsertWalletTransactions.length > 0) {
      await db.insertInto('wallet_transaction').values(toInsertWalletTransactions).execute();
    }

    logger.info('Successfully released bonuses for diamond ranks.');
  },

  async getOnHoldCommissionsByAccount(accountId: string, startDate: Date, endDate: Date) {
    const records = await db.selectFrom('commission as c')
      .innerJoin('account as a', 'c.account_id', 'a.account_id')
      .innerJoin('wallet as w', 'a.account_id', 'w.account_id')
      .select([
        'c.commission_id',
        'c.transaction_account_id',
        'c.account_id',
        'w.wallet_id',
        'a.account_email',
        'a.account_first_name',
        'a.account_last_name',
        'c.commission_amount',
        'c.commission_type',
      ])
      .where('c.transaction_account_id', '=', accountId)
      .where('c.commission_status', '=', Status.ON_HOLD)
      .where('c.created_at', '>=', startDate)
      .where('c.created_at', '<=', endDate)
      .execute();

    return records;
  },

  async releaseOnHoldCommissionsByAccount(accountId: string, ranks: RankType[], startDate: Date, endDate: Date) {
    const commissions = await this.getOnHoldCommissionsByAccount(accountId, startDate, endDate);

    if (_.isEmpty(commissions)) {
      logger.info(`No on-hold commissions to release for account ${accountId}.`);
      return;
    }

    const ranksMap = new Map(ranks.map(r => [r.ranks_id, r]));
    const commissionsByTransactionAccount = _.groupBy(commissions, 'transaction_account_id');

    const allUplineIds = Object.values(commissionsByTransactionAccount)
      .flat()
      .map(c => c.account_id);

    const snapshots = await teamService.getRankSnapshot(allUplineIds);
    const snapshotMap = new Map(snapshots.map(s => [s.account_id, s]));

    // TODO: Implement the release logic
    await db.transaction().execute(async (trx) => {

    });

  },
};
