import { Request, Response } from 'express';
import { authService } from './auth.service';
import { clearCookie, defaultOptions, setCookie } from '@utils/cookie';
import { BadRequestException } from '@utils/errors';
import { Role } from '@common/constants/roles';
import { ablyRest } from '@lib/ably';
import logger from '@utils/logger';
import { generateCsrfToken } from '@middlewares/csrf';

export const authController = {
  async login(req: Request, res: Response) {
    const data = await authService.login(req);

    const { accessToken, refreshToken } = data;

    setCookie(res, 'refresh_token', refreshToken);
    setCookie(res, 'access_token', accessToken);
    setCookie(res, 'csrf_token', generateCsrfToken(), {
      httpOnly: false
    })

    res.json({ message: 'Login successful!' });
  },

  async register(req: Request, res: Response) {
    const data = await authService.register(req);
    res.json({ data: data });
  },

  async refreshToken(req: Request, res: Response) {
    const { refresh_token: oldRefreshToken } = req.cookies;

    if (!oldRefreshToken) {
      throw new BadRequestException('Refresh token is required.');
    }

    const { accessToken, refreshToken } = await authService.refreshToken(oldRefreshToken);

    setCookie(res, 'refresh_token', refreshToken);
    setCookie(res, 'access_token', accessToken);

    res.json({
      access_token: accessToken,
      refresh_token: refreshToken
    });
  },

  async logout(req: Request, res: Response) {
    const { account_id } = req.user;

    if (!account_id) {
      throw new BadRequestException('Account ID is required.');
    }

    await authService.logout(account_id);

    clearCookie(res, 'refresh_token');
    clearCookie(res, 'access_token');
    clearCookie(res, 'csrf_token');

    res.json({ message: 'Logout successful.' });
  },

  async session(req: Request, res: Response) {
    const { account_id, account_role } = req.user ?? '';

    if (!account_id || !account_role) {
      throw new BadRequestException('Account ID is required.');
    }

    let sessionData = null;

    if (account_role === Role.DISTRIBUTOR) {
      sessionData = await authService.getSession(account_id);
    } else {
      sessionData = await authService.getAdminSession(account_id);
    }

    res.json({ data: sessionData });
  },

  async ablyAuth(req: Request, res: Response) {
    const { account_id } = req.user;

    const clientId = `user_${account_id}`;
    let tokenRequest = null;

    try {
      tokenRequest = await ablyRest.auth.createTokenRequest({ clientId: clientId });
    } catch (err) {
      logger.error('Error connecting to chat', err);
    }

    res.json(tokenRequest);
  }
};
