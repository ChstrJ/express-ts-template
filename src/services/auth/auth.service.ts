import { signAccessToken, signRefreshToken } from '@lib/jwt';
import { autoInjectable } from 'tsyringe';
import { Request } from 'express';

@autoInjectable()
export class AuthService {
  constructor() { }

  async login(req: Request) {
    const data = req.body
    const accessToken = signAccessToken(data);
    const refreshToken = signRefreshToken(data);

    return { accessToken, refreshToken };
  }
}
