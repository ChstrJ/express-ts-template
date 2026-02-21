import { compare, hash } from 'bcryptjs';

const saltRounds = 12;

export const hashPassword = async (plainText: string): Promise<string> => {
  return await hash(plainText, saltRounds);
};

export const comparePassword = async (plainText: string, hashedText: string): Promise<boolean> => {
  return await compare(plainText, hashedText);
};
