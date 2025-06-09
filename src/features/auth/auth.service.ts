import logger from '@utils/logger';
import { authRepository } from './auth.repository';
import { Request } from 'express';
import { autoInjectable, injectable } from 'tsyringe';
import { AccountRepository } from '@features/account/account.repository';

export const authService = {
  async login(req: Request) {
    const body = req.body;
    const data = await authRepository.findByEmail(body.email)
    return data;
  },

  async register(req: Request) {
    const body = req.body;
    delete body.confirm_password;
    console.log(body)
    try {
      await authRepository.create(body)
    } catch (err) {
      logger.info(err)
      return false;
    }
    return true;
  }
}

@autoInjectable()
export class AuthService {

  constructor(protected accountRepository?: AccountRepository) { }

  async login(req: Request) {
    const body = req.body;
    const data = await this.accountRepository?.findByEmail(body.email)
    return data;
  }

  async register(req: Request) {
    return 'test';
  }
}
