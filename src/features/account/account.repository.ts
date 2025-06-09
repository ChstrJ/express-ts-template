import { injectable, singleton } from 'tsyringe';
import { PrismaClient } from '@prisma/client'; // Or your actual Prisma client import
import logger from '@utils/logger';

@singleton()
@injectable() // Or @autoInjectable()
export class AccountRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient(); // Or however you instantiate/get your Prisma client
  }

  async findByEmail(email: string) {
    logger.info(`AccountRepository: Finding user by email: ${email}`);
    // Replace with your actual Prisma query
    return this.prisma.user.findUnique({ where: { email } });
  }

  async create(data: any) {
    logger.info('AccountRepository: Creating new account');
    // Replace with your actual Prisma query
    return this.prisma.user.create({ data });
  }
}
