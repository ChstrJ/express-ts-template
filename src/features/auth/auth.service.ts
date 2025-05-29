import prisma from '@lib/prisma';

export const AuthService = {

  async login(req, res) {
    const data = await prisma.account.findFirst();
    return res.json({ message: data });
  }
}
