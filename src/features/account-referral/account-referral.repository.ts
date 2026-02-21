import { IdGenerator } from '@utils/id-generator';
import db from 'src/db/db-client';

export const accountReferralRepository = {
  async insertReferral(referralCodeDetails: Record<string, string>, accountId: string): Promise<void> {
    await db
      .insertInto('account_referral')
      .values({
        account_referral_id: IdGenerator.generateUUID(),
        account_id: accountId,
        referred_by_id: referralCodeDetails?.account_id,
        referral_code_id: referralCodeDetails?.referral_code_id,
        created_at: new Date(),
        updated_at: new Date()
      })
      .execute();
  }
};
