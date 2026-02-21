import _ from 'lodash';
import dotenv from 'dotenv';
import { v5 as uuidv5 } from 'uuid';
import { Request } from 'express';
import dayjs from 'dayjs';

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

export function generateDateNow() {
  return new Date();
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

export function getCacheKey(req: Request) {
  return uuidv5(req.originalUrl, DNS_NAMESPACE);
}

export function generateCacheKey(accountId: string, req: Request) {
  const key = getCacheKey(req)
  return `${accountId}:${key}`
}

export function extractId(clientd: string) {
  return clientd.split('_')[1];
}

export function arrayWrap(value: any) {
  return Array.isArray(value) ? value : [value];
}

export function replaceTemplateVars(template: string, data: any) {
  return template.replace(/{{\s*(\w+)\s*}}/g, (match, key) => {
    return key in data ? data[key] : match;
  });
}

export interface JsonSuccessResponse<T, M = undefined> {
  success: true
  data: T
  meta?: M
}

export function jsonResponse<T, M = undefined>(
  res: Response | any,
  data: T,
  options: {
    statusCode?: number
    meta?: M
  } = {}
) {
  const response: JsonSuccessResponse<T, M> = {
    success: true,
    data,
    ...(options.meta !== undefined && { meta: options.meta }),
  }

  return res.status(options.statusCode ?? 200).json(response)
}