import { BaseRepository } from "@core/repositories/base.repository";
import { Account } from "@root/generated/prisma";


export class AccountRepository extends BaseRepository<Account> {
  protected model = '';
}
