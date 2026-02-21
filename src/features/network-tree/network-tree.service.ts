import { Role } from '@common/constants/roles';
import { Status } from '@common/constants/status';
import { getCurrentMonthRange, getLastMonthRange } from '@utils/date';
import { getImageUrl } from '@utils/helpers';
import logger from '@utils/logger';
import { getTotalRecords, QueryParams } from '@utils/pagination';
import { ReferralCommissionRecord } from '@utils/types';
import { sql } from 'kysely';
import db from 'src/db/db-client';
import { Account } from 'src/db/generated/generated-types';

const { startOfMonth, endOfMonth } = getCurrentMonthRange();

export const networkTreeService = {

    async listNetworkAndFormat(accountId: string, depth: number = 5) {
        const records = await this.listNetworkV2(accountId, depth);

        return records.map((record: Account | any) => {
            return {
                ...record,
                account_image: getImageUrl(record.account_image)
            };
        });
    },

    async listNetwork(accountId: string, depth?: number) {
        const MAX_DEPTH = depth ? depth : 5;

        const query = await sql`
    WITH RECURSIVE referral_tree AS (
        SELECT a.account_id, 
            CONCAT(a.account_first_name, ' ', a.account_last_name) as name, 
            a.account_image,
            ar.referred_by_id, 
            0 as level,
            pp.product_package_name as package_name,
            rc.referral_code
        FROM account as a
        LEFT JOIN account_referral AS ar ON a.account_id = ar.account_id
        LEFT JOIN account_product_package AS app ON a.account_id = app.account_id
        LEFT JOIN product_package AS pp ON app.product_package_id = pp.product_package_id
        INNER JOIN referral_code AS rc ON a.account_id = rc.account_id
        WHERE a.account_id = ${accountId}
            AND a.account_status = ${Status.ACTIVE}
            AND a.account_role = ${Role.DISTRIBUTOR}

        UNION ALL

        SELECT a.account_id, 
            CONCAT(a.account_first_name, ' ', a.account_last_name) as name, 
            a.account_image,
            ar.referred_by_id, 
            rt.level + 1 as level,
            pp.product_package_name as package_name,
            rc.referral_code
        FROM account AS a
        LEFT JOIN account_referral AS ar ON a.account_id = ar.account_id
        JOIN referral_tree AS rt ON ar.referred_by_id = rt.account_id
        LEFT JOIN account_product_package AS app ON a.account_id = app.account_id
        LEFT JOIN product_package AS pp ON pp.product_package_id = app.product_package_id
        INNER JOIN referral_code AS rc ON a.account_id = rc.account_id
        WHERE rt.level <= ${MAX_DEPTH}
    )
    SELECT 
        rt.account_id, 
        rt.name, 
        rt.referred_by_id, 
        rt.account_image,
        rt.level, 
        rt.package_name,
        rt.referral_code,
        SUM(c.commission_amount) as total_commission
    FROM referral_tree AS rt
    LEFT JOIN commission AS c ON rt.account_id = c.account_id
    INNER JOIN account as a ON rt.account_id = a.account_id
        WHERE a.account_status = ${Status.ACTIVE}
    GROUP BY rt.account_id, rt.name, rt.referred_by_id, rt.level, rt.package_name, rt.referral_code, rt.account_image
    `.execute(db);

        return query.rows;
    },

    async referralChainForPackageCommission(accountId: string, maxDepth: number = 7) {
        const query = await sql`
        WITH RECURSIVE referral_tree AS (
            SELECT 
                a.account_id,
                ar.referred_by_id,
                0 AS level,
                app.product_package_price AS commissionable_amount
            FROM account a
            LEFT JOIN account_referral ar ON a.account_id = ar.account_id
            LEFT JOIN account_product_package app ON a.account_id = app.account_id
            WHERE a.account_id = ${accountId}
                AND a.account_status = ${Status.ACTIVE}
                AND a.account_role = ${Role.DISTRIBUTOR}

            UNION ALL

            SELECT 
                a.account_id,
                ar.referred_by_id,
                rt.level + 1 AS level,
                rt.commissionable_amount
            FROM account a
            LEFT JOIN account_referral ar ON a.account_id = ar.account_id
            JOIN referral_tree rt ON a.account_id = rt.referred_by_id
            WHERE rt.level < ${maxDepth}
        )
        SELECT 
            rt.account_id AS referrer_id,
            ${accountId} AS referee_id,
            rt.level,
            cl.commission_percentage,
            ROUND((cl.commission_percentage / 100.0) * rt.commissionable_amount, 2) AS commission_amount
        FROM referral_tree rt
        INNER JOIN commission_level cl ON cl.commission_level = rt.level
        INNER JOIN account as a ON rt.account_id = a.account_id
            WHERE a.account_status = ${Status.ACTIVE} AND
            rt.level > 0;
    `.execute(db);

        return query.rows;
    },

    async referralChainForProductCommission(accountId: string, maxDepth: number = 7) {
        const query = await sql`
        WITH RECURSIVE referral_tree AS (
        SELECT 
            a.account_id,
            ar.referred_by_id,
            0 AS level,
            o.total_amount AS commissionable_amount
        FROM account a
        LEFT JOIN "order" o ON o.account_id = a.account_id
        LEFT JOIN account_referral ar ON a.account_id = ar.account_id
        WHERE a.account_id = ${accountId}
            AND a.account_status = ${Status.ACTIVE}
            AND a.account_role = ${Role.DISTRIBUTOR}

        UNION ALL

        SELECT 
            a.account_id,
            ar.referred_by_id,
            rt.level + 1 AS level,
            rt.commissionable_amount
        FROM account a
        LEFT JOIN account_referral ar ON a.account_id = ar.account_id
        JOIN referral_tree rt ON a.account_id = rt.referred_by_id
        WHERE rt.level < ${maxDepth}
    )
    SELECT 
        rt.account_id AS referrer_id,
        ${accountId} AS referee_id,
        rt.level,
        cl.commission_percentage,
        ROUND((cl.commission_percentage / 100.0) * rt.commissionable_amount, 2) AS commission_amount
    FROM referral_tree rt
    INNER JOIN commission_level cl ON cl.commission_level = rt.level
    INNER JOIN account as a ON rt.account_id = a.account_id
        WHERE a.account_status = ${Status.ACTIVE} AND 
        rt.level > 0;
    `.execute(db);

        return query.rows;
    },

    async addUserToTree(newUserId: string, referredById: string | null | undefined = null) {
        await db.transaction().execute(async (trx) => {

            // Step 1: Create the self-reference record (depth 0).
            await sql`
            INSERT INTO account_tree_path (ancestor_id, descendant_id, depth)
            VALUES (${newUserId}, ${newUserId}, 0);
        `.execute(trx);

            // Step 2: Find all ancestors of the referrer and create the new paths.

            if (referredById) {
                await sql`
                INSERT INTO account_tree_path (ancestor_id, descendant_id, depth)
                SELECT
                    ancestor_id,
                    ${newUserId},
                    depth + 1
                FROM account_tree_path
                WHERE descendant_id = ${referredById};
            `.execute(trx);

                logger.info(`User ${newUserId} successfully added to the network tree under referrer ${referredById}.`);
            }
        });

        return true;
    },

    async listNetworkV2(accountId: string, depth: number = 5) {
        const { startOfMonth, endOfMonth } = getCurrentMonthRange();

        return await db
            .selectFrom('account_tree_path as atp')
            .innerJoin('account as a', 'atp.descendant_id', 'a.account_id')
            .leftJoin('account_referral as ar', 'a.account_id', 'ar.account_id')
            .leftJoin('account_product_package as app', 'a.account_id', 'app.account_id')
            .leftJoin('product_package as pp', 'app.product_package_id', 'pp.product_package_id')
            .innerJoin('referral_code as rc', 'a.account_id', 'rc.account_id')
            .leftJoin('commission as c', 'a.account_id', 'c.account_id')
            .leftJoin('account_pv as apv', 'a.account_id', 'apv.account_id')
            .select([
                'a.account_id',
                sql<string>`CONCAT(a.account_first_name, ' ', a.account_last_name)`.as('name'),
                'ar.referred_by_id',
                'a.account_image',
                'pp.product_package_name as package_name',
                'rc.referral_code',
                'atp.depth as level',
                sql<number>`SUM(c.commission_amount)`.as('total_commission'),
                sql<number>`SUM(apv.pv)`.as('total_pv'),
            ])
            .where('atp.ancestor_id', '=', accountId)
            .where('atp.depth', '<=', depth)
            .where('a.account_status', '=', Status.ACTIVE)
            .where('a.account_role', '=', Role.DISTRIBUTOR)
            .groupBy([
                'a.account_id',
                'ar.referred_by_id',
                'atp.depth',
                'pp.product_package_name',
                'rc.referral_code',
                'a.account_image',
                'a.account_first_name',
                'a.account_last_name',
            ])
            .orderBy('atp.depth')
            .execute();
    },

    async referralChainForPackageCommissionV2(accountId: string, maxDepth: number = 5): Promise<ReferralCommissionRecord[]> {
        // Original approach using Kysely
        // const account: any = await db
        //     .selectFrom('account as a')
        //     .leftJoin('account_product_package as app', 'a.account_id', 'app.account_id')
        //     .select(['app.product_package_price'])
        //     .where('a.account_id', '=', accountId)
        //     .executeTakeFirst();

        // return await db
        //     .selectFrom('account_tree_path as atp')
        //     .innerJoin('account as a', 'atp.ancestor_id', 'a.account_id')
        //     .innerJoin('commission_level as cl', 'cl.commission_level', 'atp.depth')
        //     .innerJoin('account as referee', 'atp.descendant_id', 'referee.account_id')
        //     .select([
        //         'atp.ancestor_id as referrer_id',
        //         sql<string>`${accountId}`.as('referee_id'),
        //         sql<string>`CONCAT(referee.account_first_name, ' ', referee.account_last_name)`.as('referee_name'),
        //         'atp.depth as level',
        //         'cl.commission_percentage',
        //         sql<number>`ROUND((cl.commission_percentage / 100.0) * ${account.product_package_price}, 2)`.as('commission_amount'),
        //     ])
        //     .where('atp.descendant_id', '=', accountId)
        //     .where('atp.depth', '<=', maxDepth)
        //     .where('a.account_status', '=', Status.ACTIVE)
        //     .where('atp.depth', '>', 0)
        //     .orderBy('atp.depth')
        //     .execute();
        const records = await sql`
            SELECT 
                atp.ancestor_id AS referrer_id,
                ${accountId} AS referee_id,
                CONCAT(a.account_first_name, ' ', a.account_last_name) AS referrer_name,
                CONCAT(referee.account_first_name, ' ', referee.account_last_name) AS referee_name,
                atp.depth AS level,
                cl.commission_percentage,
                MAX(ROUND((cl.commission_percentage / 100.0) * pp.product_package_price, 2)) AS commission_amount,
                pp.product_package_name
            FROM account_tree_path AS atp
            INNER JOIN account AS a ON atp.ancestor_id = a.account_id
            INNER JOIN commission_level AS cl ON cl.commission_level = atp.depth
            INNER JOIN account AS referee ON atp.descendant_id = referee.account_id
            INNER JOIN account_product_package AS app ON referee.account_id = app.account_id
            INNER JOIN product_package AS pp ON app.product_package_id = pp.product_package_id
            WHERE atp.descendant_id = ${accountId}
                AND atp.depth > 0
                AND atp.depth <= ${maxDepth}
                AND a.account_status = ${Status.ACTIVE}
            GROUP BY
                atp.ancestor_id,
                referee.account_first_name,
                referee.account_last_name,
                atp.depth,
                cl.commission_percentage,
                pp.product_package_price,
                pp.product_package_name
            `.execute(db);

        return records.rows as ReferralCommissionRecord[];
    },

    async getUplines(accountId: string, maxLevel: number = 5) {
        const results = await db
            .selectFrom('account_tree_path as atp')
            .innerJoin('account as a', 'atp.ancestor_id', 'a.account_id')
            .select([
                'a.account_id',
                'a.account_first_name',
                'a.account_last_name',
                'a.account_email',
                'depth as level'
            ])
            .where('atp.descendant_id', '=', accountId)
            .where('atp.depth', '>', 0)
            .where('atp.depth', '<=', maxLevel)
            .orderBy('atp.depth', 'asc')
            .execute();

        return results;
    },

    async getDownlinesPV(accountId: string, startDate: Date = startOfMonth, endDate: Date = endOfMonth, maxLevel: number = 5) {
        const results = await db
            .selectFrom('account_tree_path as atp')
            .innerJoin('account as a', 'atp.descendant_id', 'a.account_id')
            .leftJoin('account_pv as apv', (join) =>
                join
                    .onRef('a.account_id', '=', 'apv.account_id')
                    .on('apv.created_at', '>=', startDate)
                    .on('apv.created_at', '<=', endDate)
            )
            .select([
                'a.account_id',
                'a.account_first_name',
                'a.account_last_name',
                'a.account_email',
                'a.account_status as team_member_status',
                'a.account_contact_number',
                'a.account_image',
                'depth as level',
                sql`COALESCE(SUM(apv.pv), 0)`.as('total_pv'),
                'a.created_at',
            ])
            .where('atp.ancestor_id', '=', accountId)
            .where('atp.depth', '<=', maxLevel)
            .groupBy([
                'a.account_id',
                'atp.depth',
            ])
            .orderBy('atp.depth', 'asc')
            .execute();

        return results;
    },

    async getDownlines(accountId: string, maxLevel: number = 5) {
        const results = await db
            .selectFrom('account_tree_path as atp')
            .innerJoin('account as a', 'atp.descendant_id', 'a.account_id')
            .leftJoin('account_referral as ar', 'a.account_id', 'ar.account_id')
            .select([
                'a.account_id',
                sql<string>`CONCAT(a.account_first_name, ' ', a.account_last_name)`.as('account_name'),
                'a.account_email',
                'ar.referred_by_id',
                'a.account_status as team_member_status',
                'a.account_image',
                'a.account_contact_number',
                'depth as level',
                'a.created_at',
            ])
            .where('atp.ancestor_id', '=', accountId)
            .where('atp.depth', '<=', maxLevel)
            .groupBy([
                'a.account_id',
                'ar.referred_by_id',
                'atp.depth',
            ])
            .orderBy('atp.depth', 'asc')
            .execute();

        return results;
    },

    async referralChainForProductCommissionV2(accountId: string, orderId: string, maxDepth: number = 5): Promise<ReferralCommissionRecord[]> {
        // Original approach using Kysely
        // const order: any = await db
        //     .selectFrom('order as o')
        //     .select(['o.total_amount'])
        //     .where('o.account_id', '=', accountId)
        //     .orderBy('o.created_at', 'desc')
        //     .executeTakeFirst();

        // return await db
        //     .selectFrom('account_tree_path as atp')
        //     .innerJoin('account as a', 'atp.ancestor_id', 'a.account_id')
        //     .innerJoin('commission_level as cl', 'cl.commission_level', 'atp.depth')
        //     .innerJoin('account as referee', 'atp.descendant_id', 'referee.account_id')
        //     .select([
        //         'atp.ancestor_id as referrer_id',
        //         sql<string>`${accountId}`.as('referee_id'),
        //         sql<string>`CONCAT(referee.account_first_name, ' ', referee.account_last_name)`.as('referee_name'),
        //         'atp.depth as level',
        //         'cl.commission_percentage',
        //         sql<number>`ROUND((cl.commission_percentage / 100.0) * ${order.total_amount}, 2)`.as('commission_amount'),
        //     ])
        //     .where('atp.descendant_id', '=', accountId)
        //     .where('atp.depth', '<=', maxDepth)
        //     .where('a.account_status', '=', Status.ACTIVE)
        //     .where('atp.depth', '>', 0)
        //     .orderBy('atp.depth')
        //     .execute();

        const result = await sql`
                 SELECT 
                    atp.ancestor_id AS referrer_id,
                    ${accountId} AS referee_id,
                    CONCAT(referee.account_first_name, ' ', referee.account_last_name) AS referee_name,
                    atp.depth AS level,
                    cl.commission_percentage,
                    MAX(ROUND((cl.commission_percentage / 100.0) * o.total_amount, 2)) AS commission_amount
                FROM account_tree_path AS atp
                INNER JOIN account AS a ON atp.ancestor_id = a.account_id
                INNER JOIN commission_level AS cl ON cl.commission_level = atp.depth
                INNER JOIN account AS referee ON atp.descendant_id = referee.account_id
                INNER JOIN "order" AS o ON referee.account_id = o.account_id
                WHERE atp.descendant_id = ${accountId}
                    AND atp.depth > 0
                    AND atp.depth <= ${maxDepth}
                    AND a.account_status = ${Status.ACTIVE}
                    AND o.order_id = ${orderId}
                GROUP BY
                    atp.ancestor_id,
                    referee.account_first_name,
                    referee.account_last_name,
                    atp.depth,
                    cl.commission_percentage
                `.execute(db);

        return result.rows as ReferralCommissionRecord[];
    },

    async listAccountTreePV(accountId: string, startDate: Date, endDate: Date, depth: number = 5) {
        return await db
            .selectFrom('account_tree_path as atp')
            .innerJoin('account as a', 'atp.descendant_id', 'a.account_id')
            .leftJoin('account_referral as ar', 'a.account_id', 'ar.account_id')
            .leftJoin('account_pv as apv', 'a.account_id', 'apv.account_id')
            .select([
                'a.account_id',
                sql<string>`CONCAT(a.account_first_name, ' ', a.account_last_name)`.as('name'),
                'ar.referred_by_id',
                'atp.depth as level',
                sql<number>`
        COALESCE(
          SUM(
            CASE 
              WHEN apv.created_at >= ${startDate} 
                AND apv.created_at <= ${endDate}
              THEN apv.pv
              ELSE 0
            END
          ), 
        0)`.as('total_pv'),
            ])
            .where('atp.ancestor_id', '=', accountId)
            .where('atp.depth', '<=', depth)
            .where('a.account_status', '=', Status.ACTIVE)
            .where('a.account_role', '=', Role.DISTRIBUTOR)
            .groupBy([
                'a.account_id',
                'ar.referred_by_id',
                'atp.depth',
                'a.account_first_name',
                'a.account_last_name',
            ])
            .orderBy('atp.depth')
            .execute();
    }
};
