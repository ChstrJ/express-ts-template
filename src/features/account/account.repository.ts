import { BaseRepository } from "@core/repositories/base.repository";
import { hashPassword } from "@lib/hash";
import prisma from "@lib/prisma";
import { BadRequestException, NotFoundException } from "@utils/errors";
import { injectable, singleton } from "tsyringe";

@singleton()
@injectable()
export class AccountRepository extends BaseRepository {
  protected model = prisma.account

  async findByEmail(email: string) {
    if (!email) throw new BadRequestException('Email is required.');

    const data = await prisma.account.findUnique({
      where: {
        account_email: email
      }
    })

    if (!data) throw new NotFoundException('User is not found.')

    return data;
  }

  async createAccount(data: any) {
    const body = {
      account_email: data.email,
      account_password: await hashPassword(data.password),
      account_first_name: data.first_name,
      account_last_name: data.last_name,
      account_type: "admin",
      account_contact_number: data.contact_number,
      account_status: "active",
      account_permissions: {},
    }

    return this.create(body)
  }
}
