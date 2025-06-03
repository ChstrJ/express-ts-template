import prisma from "@lib/prisma";
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
  }
};
