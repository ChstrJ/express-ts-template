import { BadRequestException } from '@utils/errors';
import db from 'src/db/db-client';
import _ from 'lodash';
import dayjs from 'dayjs';
import { Request } from 'express';

export const referralCodeService = {
  async generateReferralCodeLink(req: Request) {
    const { url } = req.body;
    const { account_id } = req.user;

    if (!url) {
      throw new BadRequestException('Url is required');
    }

    const trimUrl = _.trimEnd(url, '/');

    const referralCode = await db.selectFrom('referral_code').select('referral_code').where('account_id', '=', account_id).executeTakeFirstOrThrow();

    return `${trimUrl}/join/${referralCode.referral_code}`;
  },

  async getReferralCount(accountId: string) {
    const startOfMonth = dayjs().startOf('month').toDate();
    const endOfMonth = dayjs().endOf('month').toDate();

    const results = await db
      .selectFrom('account as a')
      .leftJoin('account_referral as ar', 'a.account_id', 'ar.account_id')
      .select(['ar.referred_by_id', (eb) => eb.fn.countAll().as('count')])
      .where('ar.referred_by_id', '=', accountId)
      .groupBy('ar.referred_by_id')
      .executeTakeFirst();

    const resultsMonthly = await db
      .selectFrom('account as a')
      .leftJoin('account_referral as ar', 'a.account_id', 'ar.account_id')
      .select(['ar.referred_by_id', (eb) => eb.fn.countAll().as('count')])
      .where('ar.referred_by_id', '=', accountId)
      .where('ar.created_at', '>=', startOfMonth)
      .where('ar.created_at', '<=', endOfMonth)
      .groupBy('ar.referred_by_id')
      .executeTakeFirst();

    const resultsTotalCount = results?.count ?? 0;
    const resultsMonthlyCount = resultsMonthly?.count ?? 0;

    return { resultsTotalCount, resultsMonthlyCount };
  },

  async getReferredBy(accountId: string) {
    const result = await db.selectFrom('account_referral')
      .select([
        'referred_by_id'
      ])
      .where('account_id', '=', accountId)
      .executeTakeFirst();

    return result?.referred_by_id ?? '';
  }
};
