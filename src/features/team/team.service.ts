import db from 'src/db/db-client';
import { applyPagination, generateMeta, getTotalRecords, getTotalRecordsDistinct, QueryParams } from '@utils/pagination';
import { generateDateNow, generateTeamName, getImageUrl } from '@utils/helpers';
import { IdGenerator } from '@utils/id-generator';
import { Status } from '@common/constants/status';
import { sql } from 'kysely';
import { filterByMonth } from '@utils/filters';
import { Role } from '@common/constants/roles';
import { applySearch } from '@utils/search';
import { getCurrentMonthRange } from '@utils/date';
import { networkTreeService } from '@features/network-tree/network-tree.service';
import _ from 'lodash';
import logger from '@utils/logger';
import dayjs from 'dayjs';
import { Rank } from '@common/constants/rank';
import { RankType } from '@utils/types';

const { startOfMonth, endOfMonth } = getCurrentMonthRange();

export const teamService = {
  rankLookup: ({ ranks, gv, pv }: { ranks: any[]; gv?: number | any; pv?: number | any }) => {
    let currentRank = 'unranked';
    for (const rank of ranks) {
      const gvValue = +(rank.gv_req ?? 0);
      const pvValue = +(rank.pv_req ?? 0);

      if (gv && gv >= gvValue) {
        currentRank = rank.name;
        break;
      }

      if (pv && pv >= pvValue) {
        currentRank = rank.name;
        break;
      }
    }
    return currentRank;
  },

  rankLookupV2(team: any, ranks: RankType[]) {
    const pv = team.total_pv || 0;
    const gv = team.total_gv || 0;

    if (!ranks?.length) {
      return {
        ...team,
        rankName: 'unranked',
        level: 1,
        bonus: 0,
        gv,
        pv,
        ranks_id: null,
      };
    }

    const achievedRank = ranks
      .filter((rank) => {
        const pvReq = Number(rank.pv_req ?? 0);
        const gvReq = Number(rank.gv_req ?? 0);
        return pv >= pvReq && gv >= gvReq;
      })
      .sort((a, b) => Number(b.pv_req) - Number(a.pv_req))[0];

    return {
      ...team,
      rank: achievedRank?.name ?? 'unranked',
    };
  },

  async createTeam(accountId: string) {
    const team = {
      team_id: IdGenerator.generateUUID(),
      team_name: generateTeamName(),
      team_leader_id: accountId,
      team_status: Status.ACTIVE,
      created_at: generateDateNow(),
      updated_at: generateDateNow(),
    };

    await db.insertInto('team').values(team).execute();
    return team;
  },

  async getRanks() {
    return await db
      .selectFrom('ranks')
      .select([
        'ranks_id',
        'name',
        'pv_req',
        'gv_req',
        'meta',
        'leg_cap',
      ])
      .orderBy('gv_req', 'desc')
      .orderBy('pv_req', 'desc')
      .execute();
  },

  async teamTreeView(accountId: string) {
    const MAX_DEPTH = 5;
    const query = await sql`
      WITH RECURSIVE referral_tree AS (
          SELECT a.account_id,
                 CONCAT(a.account_first_name, ' ', a.account_last_name) AS name,
                 a.account_image,
                 ar.referred_by_id,
                 tm.team_members_id,
                 tm.team_member_status,
                 0 AS level
          FROM account AS a
          LEFT JOIN account_referral AS ar ON a.account_id = ar.account_id
          LEFT JOIN team_members AS tm ON a.account_id = tm.account_id
          WHERE a.account_id = ${accountId}
            AND a.account_status = ${Status.ACTIVE}
            AND a.account_role = ${Role.DISTRIBUTOR}

          UNION ALL

          SELECT a.account_id,
                 CONCAT(a.account_first_name, ' ', a.account_last_name) AS name,
                 a.account_image,
                 ar.referred_by_id,
                 tm.team_members_id,
                 tm.team_member_status,
                 rt.level + 1 AS level
          FROM account AS a
          LEFT JOIN account_referral AS ar ON a.account_id = ar.account_id
          INNER JOIN referral_tree AS rt ON ar.referred_by_id = rt.account_id
          LEFT JOIN team_members AS tm ON a.account_id = tm.account_id
          WHERE rt.level <= ${MAX_DEPTH}
      )
      SELECT 
          rt.account_id,
          rt.name,
          rt.account_image,
          rt.referred_by_id,
          rt.team_members_id,
          rt.team_member_status,
          COALESCE(SUM(tmp.pv), 0) AS total_pv,
          rt.level
      FROM referral_tree AS rt
      LEFT JOIN team_members_pv AS tmp ON rt.team_members_id = tmp.team_members_id
      GROUP BY rt.account_id, rt.name, rt.account_image, rt.referred_by_id, 
               rt.team_members_id, rt.team_member_status, rt.level
    `.execute(db);

    return query.rows;
  },

  async getTeamViewAndRanks(accountId: string) {
    const ranks = await teamService.getRanks();

    const downlines = await networkTreeService.getDownlines(accountId);

    const formattedDownlines = [];
    for (const downline of downlines) {
      const rank = await teamService.computePvAndGvWithLegCap(downline.account_id, ranks as RankType[]);

      const downlineData: any = {
        ...downline,
        gv: rank.capped_gv,
        rank: rank?.ranks_name,
        total_pv: rank?.pv,
      };

      formattedDownlines.push(downlineData);
    }

    return formattedDownlines.map((downline) => ({
      ...downline,
      account_image: getImageUrl(downline.account_image),
    }));
  },

  isMemberActive: (pv: number) => (pv >= 100 ? 'active' : 'inactive'),

  isTeamActive: (gv: number) => (gv >= 1000 ? 'active' : 'inactive'),

  async getTeamGVandRankV2({ accountId, teamId }: { accountId?: string; teamId?: string }) {
    let query = db
      .selectFrom('account_tree_path as atp')
      .innerJoin('team as t', 'atp.ancestor_id', 't.team_leader_id')
      .innerJoin('account as a', 'atp.descendant_id', 'a.account_id')
      .leftJoin('account_pv as apv', 'a.account_id', 'apv.account_id')
      .select([
        't.team_id',
        't.team_name',
        sql`SUM(apv.pv)`.as('total_pv')
      ])
      .groupBy([
        't.team_id',
        't.team_name'
      ])
      .orderBy('total_pv', 'desc');

    if (accountId) {
      query = query.where('t.team_leader_id', '=', accountId);
    } else if (teamId) {
      query = query.where('t.team_id', '=', teamId);
    }

    const team = await query.executeTakeFirst();

    if (!team) {
      return { team_name: null, rank: null, total_gv: null };
    }

    const ranks = await teamService.getRanks();
    return { ...team, rank: teamService.rankLookup({ ranks, pv: team.total_pv ?? 0 }) };
  },

  async getCurrentRank(accountId: string) {
    const team = await db.selectFrom('team as t')
      .innerJoin('account as a', 't.team_leader_id', 'a.account_id')
      .leftJoin('account_pv as apv', 'a.account_id', 'apv.account_id')
      .where('t.team_leader_id', '=', accountId)
      .select([
        'a.account_id',
        't.team_name',
        sql`SUM(apv.pv)`.as('total_pv')
      ])
      .groupBy([
        'a.account_id',
        't.team_name'
      ])
      .executeTakeFirst();

    if (!team) {
      return { team_name: null, rank: null, total_gv: null };
    }

    const ranks = await teamService.getRanks();
    return { ...team, rank: teamService.rankLookup({ ranks, pv: team.total_pv ?? 0 }) };
  },

  async listTeamMembersV2(accountId: string, q: QueryParams = {}) {
    const depth = 5;
    const baseQuery = db
      .selectFrom('account_tree_path as atp')
      .innerJoin('account as a', 'atp.descendant_id', 'a.account_id')
      .leftJoin('account_pv as apv', 'a.account_id', 'apv.account_id')
      .where('atp.ancestor_id', '=', accountId)
      .where('atp.depth', '<=', depth)
      .where('a.account_status', '=', Status.ACTIVE)
      .where('a.account_role', '=', Role.DISTRIBUTOR)

    const totalRecords = await getTotalRecordsDistinct(baseQuery, 'a.account_id');

    const subquery = baseQuery
      .select([
        'a.account_id as team_members_id',
        sql<string>`CONCAT(a.account_first_name, ' ', a.account_last_name)`.as('account_name'),
        sql<number>`COALESCE(SUM(apv.pv), 0)`.as('total_pv'),
        'a.account_status as team_member_status',
        'a.account_contact_number',
        'a.account_email',
        'a.account_image',
        'a.created_at',
        'atp.depth as level'
      ])
      .$call((eb: any) => filterByMonth(eb, q, 'apv'))
      .groupBy([
        'team_members_id',
        'account_name',
        'team_member_status',
        'account_image',
        'a.created_at',
      ]);

    const records = await db
      .selectFrom(subquery.as('t'))
      .selectAll()
      .$call((eb: any) => applySearch(eb, q, 't', ['account_name']))
      .$call((eb: any) => applyPagination(eb, q))
      .orderBy('t.total_pv', 'desc')
      .execute();

    const meta = generateMeta(q, totalRecords);
    const ranks = await teamService.getRanks();

    const data = records.map((record: any) => ({
      ...record,
      account_image: getImageUrl(record.account_image),
      team_member_status: teamService.isMemberActive(record.total_pv),
      rank: teamService.rankLookup({ ranks, pv: record.total_pv }),
    }));

    return { data, meta };
  },

  async listTeamsV2(q: QueryParams) {
    const baseQuery = db
      .selectFrom('account_tree_path as atp')
      .innerJoin('team as t', 'atp.ancestor_id', 't.team_leader_id')
      .innerJoin('account as ta', 't.team_leader_id', 'ta.account_id')
      .leftJoin('account as a', 'atp.descendant_id', 'a.account_id')
      .leftJoin('account_pv as apv', 'a.account_id', 'apv.account_id')
      .select([
        't.team_id',
        't.team_leader_id',
        't.team_name',
        sql<string>`CONCAT(ta.account_first_name, ' ', ta.account_last_name)`.as('tl_name'),
        sql`SUM(apv.pv)`.as('total_gv'),
        'team_status',
      ])
      .$call((eb: any) => filterByMonth(eb, q, 'apv'))
      .$call((eb: any) => applyPagination(eb, q))
      .$call((eb: any) => applySearch(eb, q, 't', ['team_name']))

    const totalRecords = await getTotalRecordsDistinct(baseQuery, 'a.account_id');

    const teams = await baseQuery
      .groupBy(['t.team_id', 't.team_name', 't.team_leader_id', 'tl_name', 'team_status'])
      .orderBy('total_gv', 'desc')
      .execute();

    const ranks = await teamService.getRanks();
    const meta = generateMeta(q, totalRecords);

    const data = teams.map((team: any) => ({
      ...team,
      rank: teamService.rankLookup({ ranks, gv: team.total_gv }),
    }));

    return { data, meta };
  },

  async listMonthlySnapshotRanks(q: QueryParams) {
    const month = dayjs()
      .month(Number(q.month) - 1)
      .format('YYYY-MM');

    const baseQuery = db.selectFrom('ranks_monthly_snapshot as rms')
      .innerJoin('team as t', 'rms.account_id', 't.team_leader_id')
      .innerJoin('account as a', 'rms.account_id', 'a.account_id')
      .select([
        't.team_id',
        't.team_leader_id',
        't.team_name',
        sql<string>`CONCAT(a.account_first_name, ' ', a.account_last_name)`.as('tl_name'),
        't.team_status',
        'rms.pv as total_pv',
        'rms.gv as total_gv',
        'rms.ranks_name as rank',
      ])
      .where('rms.month', '=', month)
      .$call((eb: any) => applySearch(eb, q, 't', ['team_name']));

    const totalRecords = await getTotalRecords(baseQuery);

    const ranks = await baseQuery.orderBy('total_gv', 'desc').execute();

    const meta = generateMeta(q, totalRecords);

    return { data: ranks, meta };
  },

  async listTeamsV3(q: QueryParams) {
    if (q.month && Number(q.month) !== dayjs().month() + 1) {
      return this.listMonthlySnapshotRanks(q);
    }

    const baseQuery = db.selectFrom('team as t')
      .innerJoin('account as ta', 't.team_leader_id', 'ta.account_id')
      .leftJoin('account_pv as apv', 'apv.account_id', 't.team_leader_id')
      .select([
        't.team_id',
        't.team_leader_id',
        't.team_name',
        sql<string>`CONCAT(ta.account_first_name, ' ', ta.account_last_name)`.as('tl_name'),
        't.team_status',
        sql<number>`COALESCE(SUM(apv.pv), 0)`.as('total_pv'),
      ])
      .$call((eb: any) => filterByMonth(eb, q, 'apv'))
      .$call((eb: any) => applySearch(eb, q, 't', ['team_name']))
      .groupBy(['t.team_id', 't.team_leader_id', 't.team_name', 't.team_status'])

    const totalRecordsResult = await db
      .selectFrom(baseQuery.as('sub'))
      .select(db.fn.countAll().as('count'))
      .executeTakeFirst();

    const totalRecords = Number(totalRecordsResult?.count ?? 0);

    const teams = await baseQuery
      .orderBy('total_pv', 'desc')
      .$call((eb: any) => applyPagination(eb, q))
      .execute();

    const ranks = await teamService.getRanks();
    const meta = generateMeta(q, totalRecords);

    const isOverall = _.isEmpty(q.month);

    const data = await Promise.all(
      teams.map(async (team: any) => {
        const rankData = await this.computePvAndGvWithLegCap(
          team.team_leader_id,
          ranks as RankType[],
          startOfMonth,
          endOfMonth,
          isOverall,
        );
        return {
          ...team,
          total_pv: rankData.pv,
          total_gv: rankData.capped_gv,
          rank: rankData.ranks_name,
        };
      })
    );

    const sortedData = _.orderBy(data, ['total_gv'], ['desc'])

    return { data: sortedData, meta };
  },

  async countActiveLegs(accountId: string) {
    const result = await db
      .selectFrom('account_tree_path as atp')
      .innerJoin('account_pv as apv', 'atp.descendant_id', 'apv.account_id')
      .select(sql<number>`COUNT(atp.descendant_id)`.as('active_legs_count'))
      .where('atp.ancestor_id', '=', accountId)
      .where('atp.depth', '=', 1)
      .where('apv.pv', '>=', String(100))
      .executeTakeFirst();

    return result ? Number(result.active_legs_count) : 0;
  },

  async getAccountPvById(accountId: string) {
    const account = await db
      .selectFrom('account_pv')
      .select('pv')
      .where('account_id', '=', accountId)
      .executeTakeFirst();

    return +(account?.pv ?? 0);
  },

  async getTeamStats() {
    const data = await db
      .selectFrom('account_tree_path as atp')
      .innerJoin('team as t', 'atp.ancestor_id', 't.team_leader_id')
      .innerJoin('account as ta', 't.team_leader_id', 'ta.account_id')
      .leftJoin('account as a', 'atp.descendant_id', 'a.account_id')
      .leftJoin('account_pv as apv', 'a.account_id', 'apv.account_id')
      .select((eb) => [
        sql<number>`COUNT(DISTINCT t.team_leader_id)`.as('total_team'),
        sql<number>`COUNT(DISTINCT CASE WHEN t.team_status = ${Status.ACTIVE} THEN t.team_leader_id END)`.as(
          'total_active_team',
        ),
        sql<number>`COALESCE(SUM(apv.pv), 0)`.as('total_gv'),
      ])
      .executeTakeFirst();

    return {
      totalGv: data?.total_gv,
      totalTeam: data?.total_team,
      totalActiveTeam: data?.total_active_team,
      averageGV: +(data?.total_team ? (data.total_gv ?? 0) / data.total_team : 0).toFixed(2),
    };
  },

  async listTeamMembersV3(accountId: string) {
    const ranks = await teamService.getRanks();
    const teamName = await this.getTeamName(accountId);

    let leaderRank = null;
    let leaderGV = null;

    const downlines = await networkTreeService.getDownlines(accountId);

    const formattedDownlines = [];
    for (const downline of downlines) {
      const rank = await teamService.computePvAndGvWithLegCap(downline.account_id, ranks as RankType[]);

      if (downline.level === 0) {
        leaderRank = rank?.ranks_name;
        leaderGV = rank?.capped_gv;
      }

      formattedDownlines.push({
        ...downline,
        gv: rank.capped_gv,
        rank: rank?.ranks_name,
        total_pv: rank?.pv,
      })
    }

    const sortedDownlines = _.orderBy(formattedDownlines, ['total_gv', 'level'], ['desc', 'asc']);

    return {
      team_name: teamName,
      total_gv: leaderGV,
      rank: leaderRank,
      data: sortedDownlines.map((record) => ({
        ...record,
        account_image: getImageUrl(record.account_image)
      })),
    }
  },

  async getTeamName(accountId: string) {
    const data = await db.selectFrom('team')
      .select(['team_name'])
      .where('team_leader_id', '=', accountId)
      .executeTakeFirst();

    return data?.team_name ?? 'unknown';
  },

  async computePvAndGv(accountId: string, startDate: Date, endDate: Date) {
    const records = await sql`
      SELECT
          a.account_id,
          (SELECT COALESCE(SUM(pv), 0) FROM account_pv WHERE account_id = a.account_id AND created_at BETWEEN ${startDate} AND ${endDate}) AS pv,
          COALESCE(SUM(sub_apv.pv), 0) AS gv
      FROM account a
          LEFT JOIN account_tree_path atp ON atp.ancestor_id = a.account_id
            AND atp.depth BETWEEN 0 AND 5
          LEFT JOIN account_pv as sub_apv ON sub_apv.account_id = atp.descendant_id
            AND sub_apv.created_at BETWEEN ${startDate} AND ${endDate}
      WHERE
          a.account_id = ${accountId}
      GROUP BY
          a.account_id;
      `.execute(db);

    return records.rows[0];
  },

  async snapshotRanks(ranks: any, startDate: Date = startOfMonth, endDate: Date = endOfMonth) {
    logger.info('Starting rank snapshot process...');
    const accounts = await db
      .selectFrom('account_pv as pv')
      .innerJoin('account as a', 'a.account_id', 'pv.account_id')
      .select(['a.account_id'])
      .distinct()
      .where('a.account_role', '=', Role.DISTRIBUTOR)
      .where('pv.created_at', '>=', startDate)
      .where('pv.created_at', '<=', endDate)
      .execute();

    const accountIds = accounts.map(acc => acc.account_id);

    // If there's no snapshot update all accounts to unranked
    if (_.isEmpty(accountIds)) {
      const allDistributors = await db
        .selectFrom('account')
        .select('account_id')
        .where('account_role', '=', Role.DISTRIBUTOR)
        .execute();

      const allDistributorIds = allDistributors.map(d => d.account_id);

      if (!_.isEmpty(allDistributorIds)) {
        await db.updateTable('ranks_snapshot').set({
          ranks_id: null,
          ranks_name: 'unranked',
          pv: String(0),
          gv: String(0),
        })
          .where('account_id', 'in', allDistributorIds)
          .execute();
      }
      return;
    }

    const existingSnapshot = await db
      .selectFrom('ranks_snapshot')
      .select(['ranks_snapshot_id', 'account_id'])
      .where('account_id', 'in', accountIds)
      .execute();

    const existingSnapshotMap = new Map();

    for (const snapshot of existingSnapshot) {
      existingSnapshotMap.set(snapshot.account_id, snapshot);
    }

    const toInsert = [];
    const toUpdate = [];
    for (const account of accounts) {
      const rankData = await this.computePvAndGvWithLegCap(account.account_id, ranks, startDate, endDate);

      const { gv, pv, ranks_id, capped_gv, ranks_name } = rankData;

      if (existingSnapshotMap.has(account.account_id)) {
        toUpdate.push({
          account_id: account.account_id,
          ranks_id: ranks_id,
          ranks_name: ranks_name,
          pv: String(pv),
          gv: String(capped_gv),
          updated_at: generateDateNow(),
        })
      } else {
        toInsert.push({
          ranks_snapshot_id: IdGenerator.generateUUID(),
          account_id: account.account_id,
          ranks_id: ranks_id,
          ranks_name: ranks_name,
          pv: String(pv),
          gv: String(capped_gv),
          created_at: generateDateNow(),
          updated_at: generateDateNow(),
        });
      }
    }

    if (toUpdate.length > 0) {
      for (const data of toUpdate) {
        await db
          .updateTable('ranks_snapshot')
          .set({
            ranks_id: data.ranks_id,
            ranks_name: data.ranks_name,
            pv: data.pv,
            gv: data.gv,
            updated_at: data.updated_at,
          })
          .where('account_id', '=', data.account_id)
          .execute();
      }
    }

    if (toInsert.length > 0) {
      await db.insertInto('ranks_snapshot').values(toInsert).execute();
    }

    logger.info('Done rank snapshot process...');
  },

  async snapshotMonthlyRanks(ranks: any, startDate: Date = startOfMonth, endDate: Date = endOfMonth, testMode: boolean = false) {
    let month = null;
    let snapashotDate = generateDateNow();

    if (testMode) {
      month = dayjs().format('YYYY-MM');
      snapashotDate = dayjs().toDate();
    } else {
      month = dayjs().subtract(1, 'month').format('YYYY-MM');
      snapashotDate = dayjs().subtract(1, 'month').toDate();
    }

    logger.info('Starting monthly rank snapshot process...');
    const accounts = await db
      .selectFrom('account_pv as pv')
      .innerJoin('account as a', 'a.account_id', 'pv.account_id')
      .select(['a.account_id'])
      .distinct()
      .where('a.account_role', '=', Role.DISTRIBUTOR)
      .where('pv.created_at', '>=', startDate)
      .where('pv.created_at', '<=', endDate)
      .execute();

    const accountIds = accounts.map(acc => acc.account_id);

    // If there's no snapshot update all accounts to unranked
    if (_.isEmpty(accountIds)) {
      return;
    }

    const existingSnapshotMonth = await db
      .selectFrom('ranks_monthly_snapshot')
      .select(['ranks_monthly_snapshot_id', 'account_id'])
      .where('account_id', 'in', accountIds)
      .execute();

    const existingSnapshotMap = new Map();

    for (const snapshot of existingSnapshotMonth) {
      existingSnapshotMap.set(snapshot.account_id, snapshot);
    }

    const toInsert = [];
    const toUpdate = [];
    for (const account of accounts) {
      const rankData = await this.computePvAndGvWithLegCap(account.account_id, ranks, startDate, endDate);

      const { gv, pv, ranks_id, ranks_name } = rankData;

      if (existingSnapshotMap.has(account.account_id)) {
        toUpdate.push({
          account_id: account.account_id,
          ranks_id: ranks_id,
          ranks_name: ranks_name,
          pv: String(pv),
          gv: String(gv),
          updated_at: snapashotDate,
        });
      } else {
        toInsert.push({
          ranks_monthly_snapshot_id: IdGenerator.generateUUID(),
          account_id: account.account_id,
          ranks_id: ranks_id,
          ranks_name: ranks_name,
          pv: String(pv),
          gv: String(gv),
          month: month,
          created_at: snapashotDate,
          updated_at: snapashotDate,
        });
      }
    }

    if (toUpdate.length > 0) {
      for (const data of toUpdate) {
        await db.updateTable('ranks_monthly_snapshot')
          .set({
            ranks_id: data.ranks_id,
            ranks_name: data.ranks_name,
            pv: data.pv,
            gv: data.gv,
            updated_at: data.updated_at,
          })
          .where('account_id', '=', data.account_id)
          .execute();
      }
    }

    if (toInsert.length > 0) {
      await db.insertInto('ranks_monthly_snapshot').values(toInsert).execute();
    }
  },

  async getRankSnapshot(accountId: string | string[]) {
    const ids = Array.isArray(accountId) ? accountId : [accountId];

    const snapshot = await db
      .selectFrom('ranks_snapshot')
      .select([
        'account_id',
        'ranks_id',
        'ranks_name',
        'pv',
        'gv',
      ])
      .where('account_id', 'in', ids)
      .execute();

    return snapshot;
  },

  async getMonthlyRankSnapshot(testMode: boolean = false) {
    let month = null;

    if (testMode) {
      month = dayjs().format('YYYY-MM');
    } else {
      month = dayjs().subtract(1, 'month').format('YYYY-MM');
    }

    const data = await db.selectFrom('ranks_monthly_snapshot as rms')
      .innerJoin('wallet as w', 'rms.account_id', 'w.account_id')
      .select([
        'rms.account_id',
        'w.wallet_id',
        'rms.ranks_id',
        'rms.ranks_name',
        'rms.pv',
        'rms.gv',
      ])
      .where('rms.ranks_name', 'in', Rank.WITH_BONUS)
      .where('rms.month', '=', month)
      .execute();

    return data ?? [];
  },

  async computePvAndGvWithLegCap(
    accountId: string,
    ranks: RankType[],
    startDate: Date = startOfMonth,
    endDate: Date = endOfMonth,
    isOverall: boolean = false,
  ) {
    const maxDepth = 4;

    let pvResultQuery = db
      .selectFrom('account_pv')
      .select(sql<number>`COALESCE(SUM(pv), 0)`.as('pv'))
      .where('account_id', '=', accountId)

    if (!isOverall) {
      pvResultQuery = pvResultQuery
        .where('created_at', '>=', startDate)
        .where('created_at', '<=', endDate);
    }

    const pvResult = await pvResultQuery.executeTakeFirst();

    const pv = Number(pvResult?.pv ?? 0);

    // Get all direct legs(depth = 1)
    const directLegs = await db
      .selectFrom('account_tree_path')
      .select('descendant_id')
      .where('ancestor_id', '=', accountId)
      .where('depth', '=', 1)
      .execute();

    if (directLegs.length === 0) {
      return {
        pv: pv,
        gv: 0,
        capped_gv: 0,
        ranks_id: null,
        ranks_name: 'unranked',
        bonus: 0,
        level: 1,
        is_leg_capped: false
      }
    }

    const legVolumes = await Promise.all(
      directLegs.map(async (leg) => {
        let legPvQuery = db
          .selectFrom('account_pv as pv')
          .innerJoin('account_tree_path as path', 'pv.account_id', 'path.descendant_id')
          .select(sql<number>`COALESCE(SUM(pv), 0)`.as('pv'))
          .where('path.ancestor_id', '=', leg.descendant_id)
          .where('path.depth', '<=', maxDepth);

        if (!isOverall) {
          legPvQuery = legPvQuery
            .where('pv.created_at', '>=', startDate)
            .where('pv.created_at', '<=', endDate);
        }

        const legPvResult = await legPvQuery.executeTakeFirst();
        return Number(legPvResult?.pv || 0);
      })
    );

    // let baseRankIndex = -1;
    // for (let i = 0; i < ranks.length; i++) {
    //   const rank = ranks[i];
    //   if (pv >= (rank.pv_req ?? 0) && totalGV >= (rank.gv_req ?? 0)) {
    //     baseRankIndex = i;
    //     break;
    //   }
    // }

    // let cappingRank;
    // if (baseRankIndex === -1) {
    //   // User is unranked, use lowest rank's rules for capping
    //   cappingRank = ranks[ranks.length - 1];
    // } else if (baseRankIndex === 0) {
    //   // User is at highest rank, use highest rank's rules
    //   cappingRank = ranks[0];
    // } else {
    //   // Use next rank up's rules
    //   cappingRank = ranks[baseRankIndex - 1];
    // }

    // const gvReqForCapping = cappingRank.gv_req ?? 0;
    // const legCapForCapping = Number(cappingRank.leg_cap ?? 0);

    const sortedLegs = [...legVolumes].sort((a, b) => b - a);
    const strongestLegGv = sortedLegs.length > 0 ? sortedLegs[0] : 0;
    const weakLegs = sortedLegs.slice(1);
    const weakLegsTotalGv = weakLegs.reduce((a, b) => a + b, 0);

    const activeLegsCount = legVolumes.filter(v => v > 0).length;

    let cappedGV = 0;
    let totalGV = legVolumes.reduce((a, b) => a + b, 0);

    for (const rank of ranks) {
      const pvReq = rank?.pv_req ?? 0;
      const gvReq = rank?.gv_req ?? 0;
      const legCap = Number(rank?.leg_cap) ?? 0;
      const legCapLimit = (gvReq * (legCap / 100));

      const cappedStrongestLegGv = Math.min(strongestLegGv, legCapLimit);
      cappedGV = cappedStrongestLegGv + weakLegsTotalGv;

      if (pv >= (pvReq ?? 0) && cappedGV >= (gvReq ?? 0)) {
        return {
          pv,
          gv: totalGV,
          capped_gv: Number(cappedGV.toFixed(2)),
          ranks_id: rank.ranks_id,
          ranks_name: rank.name,
          bonus: rank.meta.group_bonus ?? 0,
          level: rank.meta.max_levels ?? 1,
        };
      }
    }

    return {
      pv: pv,
      gv: totalGV,
      capped_gv: Number(cappedGV.toFixed(2)),
      ranks_id: null,
      ranks_name: 'unranked',
      bonus: 0,
      level: 1,
    };
  },

  async recomputeUplineRanks(accountId: string, ranks: RankType[]) {
    const uplines = await networkTreeService.getUplines(accountId);

    const toUpdateOrInsertRanks = [];
    for (const upline of uplines) {
      const rankData = await this.computePvAndGvWithLegCap(upline.account_id, ranks);

      if (rankData && rankData.ranks_name !== 'unranked') {
        toUpdateOrInsertRanks.push({
          ranks_snapshot_id: IdGenerator.generateUUID(),
          account_id: upline.account_id,
          ranks_id: rankData.ranks_id,
          ranks_name: rankData.ranks_name,
          pv: String(rankData.pv),
          gv: String(rankData.capped_gv),
          created_at: generateDateNow(),
          updated_at: generateDateNow(),
        });
      }
    }

    const accountIds = toUpdateOrInsertRanks.map((item) => item.account_id);

    const existingSnapshots = await db
      .selectFrom('ranks_snapshot')
      .select(['account_id'])
      .where('account_id', 'in', accountIds)
      .execute();

    const existingAccountIds = existingSnapshots.map((item) => item.account_id);

    const toUpdate = [];
    for (const accountId of existingAccountIds) {
      const rankToUpdate = toUpdateOrInsertRanks.find((item) => item.account_id === accountId);

      if (rankToUpdate) {
        toUpdate.push(rankToUpdate);
      }
    }

    const toInsert = toUpdateOrInsertRanks.filter(
      (item) => !existingAccountIds.includes(item.account_id),
    );

    if (toUpdate.length > 0) {
      await Promise.all(
        toUpdate.map(async (record) => {
          db.updateTable('ranks_snapshot')
            .set({
              ranks_id: record.ranks_id,
              ranks_name: record.ranks_name,
              pv: record.pv,
              gv: record.gv,
              updated_at: generateDateNow(),
            })
            .where('account_id', '=', record.account_id)
            .execute();
        })
      )
    }

    if (toInsert.length > 0) {
      await db.insertInto('ranks_snapshot').values(toInsert).execute();
    }

    return true;
  }
};
