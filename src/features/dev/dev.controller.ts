import { accountRepository } from '@features/account/account.repository';
import { Request, Response } from 'express';
import { devService } from './dev.service';
import { setCookie } from '@utils/cookie';

export const devController = {
  async createAccount(req: Request, res: Response) {
    const data = req.body;

    await accountRepository.createAccount(data);

    res.json({ data: true });
  },

  async login(req: Request, res: Response) {
    const { email } = req.body;

    const account = await devService.login(email);

    const { accessToken, refreshToken } = account;

    setCookie(res, 'refresh_token', refreshToken);
    setCookie(res, 'access_token', accessToken);

    res.json({
      access_token: accessToken,
      refresh_token: refreshToken,
    })
  },

  async changePassword(req: Request, res: Response) {
    const { email, password } = req.body;

    const data = await devService.changePassword(email, password);

    res.json(data)
  }
};
