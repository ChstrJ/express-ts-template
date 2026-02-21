import { Request } from 'express';
import { comparePassword } from '@lib/hash';
import { signAccessToken, signRefreshToken } from '@lib/jwt';
import { UnauthorizedError } from '@utils/errors';
import { authRepository } from './auth.repository';

export const authService = {
  async login(req: Request) {
    const { email, password } = req.body;
    const data = await authRepository.findByEmail(email);

    const { account_password } = data;

    if (! await comparePassword(password, account_password)) {
      throw new UnauthorizedError('Invalid credentials.');
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