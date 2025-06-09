import { BaseRepository } from "@core/repositories/base.repository";
import { hashPassword } from "@lib/hash";
import prisma from "@lib/prisma";
import { Account } from "@prisma/client";
import { BadRequestException, NotFoundException } from "@utils/errors";

export const authRepository = {
  async findByEmail(email: string) {
    if (!email) throw new BadRequestException('Email is required.');

    const data = await prisma.account.findUnique({
      where: {
        account_email: email
      }
    })

    if (!data) throw new NotFoundException('User is not found.')

    return data;
  },

  async create(data: any) {
    return await prisma.account.create({
      // @ts-ignore
      data: {
        account_email: data.email,
        account_password: await hashPassword(data.password),
        account_first_name: data.first_name,
        account_last_name: data.last_name,
        account_type: "admin",
        account_contact_number: data.contact_number,
        account_status: "active",
        account_permissions: {},
      }
    })
  }
};
