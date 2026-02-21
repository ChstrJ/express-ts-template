import { Status } from '@common/constants/status';
import { BadRequestException, NotFoundException } from '@utils/errors';
import { generateReferralCode } from '@utils/helpers';
import { IdGenerator } from '@utils/id-generator';
import db from 'src/db/db-client';

export const referralCodeRepository = {
  async createReferralCode(accountId: string) {
    const referralCode = generateReferralCode();

    return await db
      .insertInto('referral_code')
      .values({
        referral_code_id: IdGenerator.generateUUID(),
        account_id: accountId,
        referral_code: referralCode,
        updated_at: new Date(),
        created_at: new Date()
      })
      .execute();
  },

  async findAccountIdByReferralCode(referralCode: string) {
    const referral = await db
      .selectFrom('referral_code as rc')
      .innerJoin('account as a', 'a.account_id', 'rc.account_id')
      .select(['a.account_id', 'a.account_first_name', 'a.account_last_name', 'a.account_email', 'rc.referral_code', 'rc.referral_code_id', 'a.account_status'])
      .where('rc.referral_code', '=', referralCode)
      .executeTakeFirstOrThrow(() => new NotFoundException('Referral code not found.'));

    if (referral.account_status !== Status.ACTIVE) {
      throw new BadRequestException('The referral code has not been activated yet.');
    }

    return referral;
  }
};
