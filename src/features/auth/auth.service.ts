import { Request } from 'express';
import { comparePassword } from '@lib/hash';
import { UnauthorizedException } from '@utils/errors';
import { signAccessToken, signRefreshToken } from '@lib/jwt';
import db from 'src/db/db-client';
import dayjs from 'dayjs';
import { IdGenerator } from '@utils/id-generator';
import _ from 'lodash';
import { Status } from '@common/constants/status';

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

    return true;
  },

  async register(req: Request) {
    return true;
  },

  async refreshToken(refreshToken: string) {
    return [];
  },

  async logout(accountId: string) {
    return true;
  },

  async getSession(accountId: string) {
    return [];
  }
};
