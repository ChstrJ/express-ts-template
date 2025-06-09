import { Request } from 'express';
import { autoInjectable, inject, injectable, singleton } from 'tsyringe';
import { AccountRepository } from '@features/account/account.repository';

@singleton()
@injectable()
export class AuthService {
  constructor(@inject(AccountRepository) private accountRepository: AccountRepository) { }

  async login(req: Request) {
    const body = req.body;
    const data = await this.accountRepository?.findByEmail(body.email)
    return data;
  }

  async register(req: Request) {
    const data = await this.accountRepository.createAccount(req.body)
    return data;
  }
}
