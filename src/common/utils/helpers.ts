import _ from 'lodash';
import dotenv from 'dotenv';
import { v5 as uuidv5 } from 'uuid';

dotenv.config();
const DNS_NAMESPACE = uuidv5.DNS;

export function dd(...args: any) {
  for (const arg of args) {
    console.dir(arg, { depth: null, colors: true });
  }
  process.exit(1);
}

export function generateRandom(length: number = 6) {
  let result = '';

  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const charactersLength = characters.length;

  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
}

export function formatError(zodError: any) {
  return zodError.error.errors.reduce(
    (acc: any, err: any) => {
      const path = err.path.join('.');
      if (!acc[path]) {
        acc[path] = [];
      }
      acc[path].push(err.message);
      return acc;
    },
    {} as Record<string, string[]>
  );
}