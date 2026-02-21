import db from 'src/db/db-client';
import _ from 'lodash';
import NodeCache from 'node-cache';
import { Account } from 'src/db/generated/generated-types';

const cache = new NodeCache();

export const getAccountBasedOnToken = async (payload: any) => {
  const { account_id } = payload;
  const cacheKey = `account:${account_id}`;

  // Check if account data is cached
  const cachedData = cache.get<Account>(cacheKey);

  if (cachedData) {
    return cachedData;
  }

  const data = await db.selectFrom('account').select(['account_id', 'account_email', 'account_role', 'account_status']).where('account_id', '=', account_id).executeTakeFirst();

  cache.set(cacheKey, data, 1800);

  return data ?? null;
};
