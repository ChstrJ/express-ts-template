import db from 'src/db/db-client';

export const getAccountBasedOnToken = async (payload: any) => {
  const { account_id } = payload;

  const data = await db.selectFrom('account')
    .select([
      'account_id',
      'account_email',
      'account_role',
      'account_status'])
    .where('account_id', '=', account_id)
    .executeTakeFirst();

  return data ?? null;
};
