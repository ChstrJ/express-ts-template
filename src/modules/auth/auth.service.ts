import { Request } from 'express';
import { authRepository } from '@features/auth/auth.repository';
import { comparePassword } from '@lib/hash';
import { UnauthorizedException } from '@utils/errors';
import { signAccessToken, signRefreshToken } from '@lib/jwt';

export const authService = {
  async login(req: Request) {
    const { email, password } = req.body;
    const data = await authRepository.findByEmail(email);

    const { account_password } = data;

    if (! await comparePassword(password, account_password)) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const accessToken = signAccessToken(data);
    const refreshToken = signRefreshToken(data);

    return { accessToken, refreshToken };
  },

  async register(req: Request) {
    const data = await authRepository.createAccount(req.body)
    return data;
  }
}