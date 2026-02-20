
import { hashPassword } from "@lib/hash";
import { BadRequestError, NotFoundError } from "@utils/errors";
import db from "src/db/db-client";

export const authRepository = {
  async findByEmail(email: string) {
    if (!email) throw new BadRequestError('Email is required.');

    const data = await db.selectFrom('account')
      .select([
        'account_id',
        'account_email',
        'account_role',
        'account_status',
        'account_password'
      ])
      .where('account_email', '=', email)
      .execute();

    if (!data) throw new NotFoundError('User is not found.')

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
