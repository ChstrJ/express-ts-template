import { Request, Response } from 'express';
import { authService } from './auth.service';
import { setCookie } from '@utils/cookie';

export const authController = {
  async login(req: Request, res: Response) {
    const data = await authService.login(req);

    const { accessToken, refreshToken } = data;

    setCookie(res, 'refresh_token', refreshToken)
    setCookie(res, 'access_token', accessToken)

    res.json({
      'access_token': accessToken,
      'refresh_token': refreshToken
    })
  },

  async register(req: Request, res: Response) {
    const data = await authService.register(req)
    res.json({ data: data })
  }
}