import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { injectable, singleton, inject } from 'tsyringe';
import { setCookie } from '@utils/cookie';

@singleton()
@injectable()
export class AuthController {

  constructor(@inject(AuthService) protected authService: AuthService) { }

  async login(req: Request, res: Response) {
    const data = await this.authService.login(req);

    const { accessToken, refreshToken } = data;

    setCookie(res, 'refresh_token', refreshToken)
    setCookie(res, 'access_token', accessToken)

    return res.json({
      'access_token': accessToken,
      'refresh_token': refreshToken
    })
  }

  async register(req: Request, res: Response) {
    const data = await this.authService.register(req)
    return res.json({ data: data })
  }
}
