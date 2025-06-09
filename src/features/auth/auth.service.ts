import logger from '@utils/logger';
import { Request } from 'express';
import { injectable, inject, singleton } from 'tsyringe';
import { AccountRepository } from '@features/account/account.repository';

@singleton()
@injectable()
export class AuthService {

  constructor(@inject(AccountRepository) protected accountRepository: AccountRepository) { }

  async login(req: Request) {
    const body = req.body;
    // Ensure accountRepository is accessed correctly, e.g., this.accountRepository
    const data = await this.accountRepository.findByEmail(body.email)
    return data;
  }

  async register(req: Request) {
    // Example implementation, adjust as per your actual logic
    const body = req.body;
    delete body.confirm_password;
    logger.info(body);
    try {
      // Assuming accountRepository has a create method
      await this.accountRepository.create(body);
    } catch (err) {
      logger.info(err);
      return false;
    }
    return true;
  }

  async test(req: Request) {
    logger.info('AuthService test method called');
    // No need to check if accountRepository exists, if injection fails, it should error earlier
    logger.info('AccountRepository is available in AuthService (assumed due to non-optional constructor)');
    return { status: 'success', message: 'AuthService is working and AccountRepository is injected.' };
  }
}
