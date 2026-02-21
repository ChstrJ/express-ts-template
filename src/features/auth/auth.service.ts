import { Request } from 'express';
import { comparePassword } from '@lib/hash';
import { NotFoundException, UnauthorizedException } from '@utils/errors';
import { signAccessToken, signRefreshToken } from '@lib/jwt';
import db from 'src/db/db-client';
import dayjs from 'dayjs';
import { IdGenerator } from '@utils/id-generator';
import dotenv from 'dotenv';
import _ from 'lodash';
import { accountRepository } from '@features/account/account.repository';
import { accountService } from '@features/account/account.service';
import { referralCodeRepository } from '@features/referral-code/referral-code.repository';
import { productPackageRepository } from '@features/product-package/product-package.repository';
import { accountReferralRepository } from '@features/account-referral/account-referral.repository';
import { accountPackageRepository } from '@features/account-package/account-package.repository';
import { Status } from '@common/constants/status';
import { formatName, generateDateNow, getImageUrl, sendNotif } from '@utils/helpers';
import { NotifCode } from '@common/constants/notifs-code';
import { EmailType } from '@common/constants/email';
import { EmailJob } from 'src/jobs/email';
import { AlertJob } from 'src/jobs/alert';
import { Role } from '@common/constants/roles';

dotenv.config();

export const authService = {
  async insertRefreshToken(accountId: string, refreshToken: string) {
    await db
      .insertInto('refresh_token')
      .values({
        refresh_token_id: IdGenerator.generateUUID(),
        refresh_token: refreshToken,
        account_id: accountId,
        expires_at: dayjs().add(30, 'days').toDate(),
        revoked: 0,
        created_at: new Date(),
        updated_at: new Date()
      })
      .execute();

    return true;
  },

  async login(req: Request) {
    const { email, password } = req.body;

    const data = await accountRepository.findByEmail(email);

    if (!(await comparePassword(password, data.account_password))) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const filteredData = _.omit(data, ['account_password']);

    if (filteredData?.account_status === Status.PENDING) {
      throw new UnauthorizedException('Your account is currently pending admin approval.');
    }

    if (filteredData?.account_status !== Status.ACTIVE) {
      throw new UnauthorizedException('Your account is disabled.');
    }

    const accessToken = signAccessToken(filteredData);
    const refreshToken = signRefreshToken(filteredData);

    await this.insertRefreshToken(data.account_id, refreshToken);

    return { accessToken, refreshToken };
  },

  async register(req: Request) {
    const data = req.body;

    const { account, referral } = await accountService.createAccountWithReferralCode(data);

    if (referral) {
      await accountReferralRepository.insertReferral(referral, account?.account_id);
    }

    if (data.package_id) {
      const productPackage = await productPackageRepository.findProductPackageById(data.package_id);

      await accountPackageRepository.insertAccountPackage(account?.account_id, productPackage);

      await AlertJob.addToQueue({
        code: NotifCode.NEW_DISTRIBUTOR,
        role: Role.ADMIN_ROLES,
        content: {
          link: '/pending-account'
        }
      });
    }

    await EmailJob.addToQueue({
      type: EmailType.REPLY_TO_NEW_APPLICANTS_EMAIL,
      payload: {
        to: account.account_email,
        account_name: formatName(account.account_first_name, account.account_last_name)
      }
    })

    await referralCodeRepository.createReferralCode(account?.account_id);

    return true;
  },

  async refreshToken(refreshToken: string) {
    const tokenRecord = await db.selectFrom('refresh_token').selectAll().where('refresh_token', '=', refreshToken).executeTakeFirst();

    if (!tokenRecord) {
      throw new NotFoundException('Refresh token not found.');
    }

    if (tokenRecord?.revoked) {
      throw new UnauthorizedException('Refresh token has been revoked.');
    }

    if (dayjs(tokenRecord.expires_at).isBefore(dayjs())) {
      throw new UnauthorizedException('Refresh token has expired.');
    }

    const accountData = await db.selectFrom('account').select(['account_id', 'account_email', 'account_role']).where('account_id', '=', tokenRecord.account_id).executeTakeFirst();

    if (!accountData) {
      throw new NotFoundException('Account not found.');
    }

    const filteredData = _.omit(accountData, ['account_password']);

    const newAccessToken = signAccessToken(filteredData);
    const newRefreshToken = signRefreshToken(filteredData);
    await this.insertRefreshToken(accountData?.account_id, refreshToken);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    };
  },

  async logout(accountId: string) {
    await db.deleteFrom('refresh_token').where('account_id', '=', accountId).execute();

    return true;
  },

  async getAdminSession(accountId: string) {
    const sessionData = await db
      .selectFrom('account as a')
      .leftJoin('account_permission as ap', 'a.account_id', 'ap.account_id')
      .select(['a.account_id', 'a.account_email', 'a.account_first_name', 'a.account_last_name', 'a.account_role', 'a.account_contact_number', 'ap.permission_meta'])
      .where('a.account_id', '=', accountId)
      .executeTakeFirst();

    if (!sessionData) {
      throw new NotFoundException('Session not found.');
    }

    const formattedSessionData = {
      account: {
        id: sessionData.account_id,
        email: sessionData.account_email,
        first_name: sessionData.account_first_name,
        last_name: sessionData.account_last_name,
        type: sessionData.account_role,
        contact_number: sessionData.account_contact_number,
        permissions: sessionData?.permission_meta
      }
    };

    return formattedSessionData;
  },

  async getSession(accountId: string) {
    const sessionData = await db
      .selectFrom('account as a')
      .leftJoin('referral_code as rc', 'a.account_id', 'rc.account_id')
      .leftJoin('account_product_package as app', 'a.account_id', 'app.account_id')
      .leftJoin('account_referral as ac', 'a.account_id', 'ac.account_id')
      .leftJoin('product_package as pp', 'app.product_package_id', 'pp.product_package_id')
      .leftJoin('account_permission as ap', 'a.account_id', 'ap.account_id')
      .select([
        'a.account_id',
        'a.account_email',
        'a.account_first_name',
        'a.account_last_name',
        'a.account_image',
        'a.account_role',
        'a.account_contact_number',
        'pp.product_package_id',
        'pp.product_package_name',
        'pp.product_package_description',
        'pp.product_package_price',
        'rc.referral_code',
        'ac.referred_by_id'
      ])
      .where('a.account_id', '=', accountId)
      .executeTakeFirst();

    if (!sessionData) {
      throw new NotFoundException('Session not found.');
    }

    const formattedSessionData = {
      account: {
        id: sessionData.account_id,
        email: sessionData.account_email,
        first_name: sessionData.account_first_name,
        last_name: sessionData.account_last_name,
        type: sessionData.account_role,
        contact_number: sessionData.account_contact_number,
        image: getImageUrl(sessionData.account_image)
      },
      referral: {
        referred_by: sessionData.referred_by_id || null,
        code: sessionData.referral_code || null,
        link: this.generateReferralLink(sessionData.referral_code || '')
      },
      product_package: {
        id: sessionData.product_package_id,
        name: sessionData.product_package_name,
        description: sessionData.product_package_description,
        price: sessionData.product_package_price
      }
    };

    return formattedSessionData;
  },

  generateReferralLink(code: string) {
    return `${process.env.APP_URL}/join/${code}`;
  }
};
