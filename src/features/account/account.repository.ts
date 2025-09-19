import { hashPassword } from "@lib/hash";
import { BadRequestException, NotFoundException } from "@utils/errors";
import db from "src/db/db-client";

export const accountRepository = {
  async findByEmail(email: string) {
    if (!email) throw new BadRequestException('Email is required.');

    const data = await db.selectFrom('account')
      .select([
        'account_id',
        'account_email',
        'account_role',
        'account_status'])
      .where('account_email', '=', email)
      .execute();

    if (!data) throw new NotFoundException('User is not found.')

    return data;
  },

  async createAccount(data: any) {
    const body = {
      account_email: data.email,
      account_password: await hashPassword(data.password),
      account_first_name: data.first_name,
      account_last_name: data.last_name,
      account_type: "admin",
      account_contact_number: data.contact_number,
      account_status: "active",
    }

    try {
      await db.insertInto('account').values(body).execute();
    } catch (err) {
      console.log(err)
    }
  }
}