import { Role } from '@common/constants/roles';
import { Status } from '@common/constants/status';
import { hashPassword } from '@lib/hash';
import { AlreadyExistsException, BadRequestException, UnauthorizedException } from '@utils/errors';
import { applyPagination, generateMeta, getTotalRecords, QueryParams } from '@utils/pagination';
import { IdGenerator } from '@utils/id-generator';
import db from 'src/db/db-client';
import { sql } from 'kysely';
import { getImageUrl } from '@utils/helpers';
import { applySearch } from '@utils/search';
import { filterByDateRange } from '@utils/filters';

export const accountRepository = {
  async findByEmail(email: string) {
    if (!email) throw new BadRequestException('Email is required.');

    const data = await db
      .selectFrom('account')
      .select(['account_id', 'account_email', 'account_password', 'account_role', 'account_status'])
      .where('account_email', '=', email)
      .executeTakeFirstOrThrow(() => new UnauthorizedException('Invalid credentials.'));

    return data;
  },

  async createAccount(data: any) {
    const insertData = {
      account_id: IdGenerator.generateUUID(),
      account_email: data.email,
      account_password: await hashPassword(data.password),
      account_first_name: data.first_name,
      account_last_name: data.last_name,
      account_role: data?.role ?? Role.DISTRIBUTOR,
      account_contact_number: data.contact_number,
      account_status: data.status ?? Status.PENDING,
      created_at: new Date(),
      updated_at: new Date()
    };

    try {
      await db.insertInto('account').values(insertData).execute();
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

    return insertData;
  },

  async approveAccountById(accountId: string) {
    await db
      .updateTable('account')
      .set({
        account_status: Status.ACTIVE,
        updated_at: new Date()
      })
      .where('account_id', '=', accountId)
      .execute();

    return true;
  },

  async getPendingDistributors(q: QueryParams) {
    const baseQuery = db
      .selectFrom('account as a')
      .leftJoin('account_product_package as app', 'a.account_id', 'app.account_id')
      .leftJoin('product_package as pp', 'app.product_package_id', 'pp.product_package_id')
      .leftJoin('account_referral as rf', 'a.account_id', 'rf.account_id')
      .leftJoin('account as referrer', 'rf.referred_by_id', 'referrer.account_id')
      .leftJoin('account_reason as ar', 'a.account_id', 'ar.account_id')
      .where('a.account_status', 'in', [Status.PENDING, Status.REJECTED])
      .where('a.account_role', '=', Role.DISTRIBUTOR);

    const totalRecords = await getTotalRecords(baseQuery);

    const data = await baseQuery
      .select([
        'a.account_id',
        'a.account_email',
        'a.account_first_name',
        'a.account_last_name',
        'a.account_role',
        'a.account_contact_number',
        'ar.reason_message',
        'pp.product_package_name',
        'app.product_package_price',
        'a.account_status',
        sql`CONCAT(referrer.account_first_name, ' ', referrer.account_last_name)`.as('referred_by')
      ])
      .$call((eb) => applyPagination(eb, q))
      .orderBy('a.created_at', 'desc')
      .execute();

    const meta = generateMeta(q, totalRecords);

    return { data, meta };
  },

  async listDistributors(q: QueryParams) {
    const baseQuery = db
      .selectFrom('account as a')
      .leftJoin('referral_code as rc', 'a.account_id', 'rc.account_id')
      .leftJoin('account_product_package as app', 'a.account_id', 'app.account_id')
      .innerJoin('product_package as pp', 'app.product_package_id', 'pp.product_package_id')

    const totalRecords = await getTotalRecords(baseQuery);

    const records = await baseQuery
      .select([
        'a.account_id',
        'a.account_email',
        'a.account_first_name',
        'a.account_last_name',
        'a.account_role',
        'a.account_contact_number',
        'a.account_status',
        'a.account_image',
        'pp.product_package_id',
        'pp.product_package_name',
        'app.product_package_price',
        'a.created_at',
        'a.updated_at'
      ])
      .$call((eb: any) => filterByDateRange(eb, q, 'a'))
      .$call((eb: any) => applyFilters(eb, q))
      .$call((eb: any) => applyPagination(eb, q))
      .$call((eb: any) => applySearch(eb, q, 'a', ['account_first_name', 'account_last_name']))
      .orderBy('created_at', 'desc')
      .execute();

    const meta = generateMeta(q, totalRecords);

    const data = records.map((record: any) => {
      return {
        ...record,
        account_image: getImageUrl(record.account_image)
      };
    });

    return { data, meta };
  },

};

export const applyFilters = (baseQuery: any, q: QueryParams) => {
  if (q.status && Status.VALID_STATUSES.includes(q.status)) {
    baseQuery = baseQuery.where('a.account_status', '=', q.status);
  }

  if (q.role && Role.VALID_ROLES.includes(q.role)) {
    baseQuery = baseQuery.where('a.account_role', '=', q.role);
  }

  return baseQuery;
};
