import { accountRepository } from "@features/account/account.repository";
import { hashPassword } from "@lib/hash";
import { signAccessToken, signRefreshToken } from "@lib/jwt";
import _ from "lodash";
import db from "src/db/db-client";
import dotenv from "dotenv";
dotenv.config();

export const devService = {
  async login(email: string) {
    const account = await accountRepository.findByEmail(email);

    const filteredData = _.omit(account, ['account_password']);

    const accessToken = signAccessToken(filteredData);
    const refreshToken = signRefreshToken(filteredData);

    return {
      accessToken: accessToken,
      refreshToken: refreshToken
    }
  },

  async changePassword(email: string, newPassword: string) {
    const account = await accountRepository.findByEmail(email);

    const password = await hashPassword(newPassword);

    await db.updateTable('account')
      .set({ account_password: password })
      .where('account_id', '=', account.account_id)
      .execute();

    return true;
  }
}
