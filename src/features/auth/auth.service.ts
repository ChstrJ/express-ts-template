import { Request } from 'express';
import { autoInjectable, inject, injectable, singleton } from 'tsyringe';
import { AccountRepository } from '@features/account/account.repository';
import { comparePassword } from '@lib/hash';
import { BadRequestException, UnauthorizedException } from '@utils/errors';
import { setCookie } from '@utils/cookie';
import { signAccessToken, signRefreshToken } from '@lib/jwt';
import { redis } from '@lib/redis';

@singleton()
@injectable()
export class AuthService {
  constructor(@inject(AccountRepository) private accountRepository: AccountRepository) { }

  async login(req: Request) {
    const { email, password } = req.body;
    const data = await this.accountRepository.findByEmail(email);

    const { account_password } = data;

    if (! await comparePassword(password, account_password)) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const accessToken = signAccessToken(data);
    const refreshToken = signRefreshToken(data);

    return { accessToken, refreshToken };
  }

  async register(req: Request) {
    const data = await this.accountRepository.createAccount(req.body)
    return data;
  }
}
