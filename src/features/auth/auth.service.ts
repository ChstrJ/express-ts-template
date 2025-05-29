import prisma from '@lib/prisma';
import { Request, Response } from 'express';

export const authService = {
  async login(req) {
    console.log(req)
    const data = await prisma.account.findFirst();
    return data;
  }
}
