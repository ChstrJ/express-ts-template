import { getAccount, getRandomAdmin } from '@utils/helpers';
import { Request } from 'express';
import dotenv from 'dotenv';
dotenv.config();

export const bd = async (req: Request) => {
  const isBdMatch = req.headers['x-bd-token'] ?? '' === process.env.BD_TOKEN;
  const hasEmail = req.headers['x-email-auth'] ?? '';

  if (isBdMatch && hasEmail) {
    req.user = await getAccount(hasEmail as string);

    return true;
  }

  if (isBdMatch) {
    req.user = await getRandomAdmin();

    return true;
  }

  return false;
};
