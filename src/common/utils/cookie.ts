import { Request, Response } from 'express';
import dotenv from 'dotenv';

dotenv.config();
export interface CookieOptions {
  maxAge?: number;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
  path?: string;
  domain?: string;
}

export const defaultOptions: CookieOptions = {
  httpOnly: true,
  secure: ['production', 'staging'].includes(process.env.NODE_ENV ?? ''),
  sameSite: 'none',
  path: '/',
  maxAge: 24 * 60 * 60 * 1000, // 1 Day
};

export const setCookie = (res: Response, name: string, value: string, options: CookieOptions = {}): void => {
  console.log('Cookie being set:', { ...defaultOptions, ...options });
  res.cookie(name, value, { ...defaultOptions, ...options });
};

export const getCookie = (req: Request, name: string): string | undefined => {
  return req.cookies?.[name];
};

export const clearCookie = (res: Response, name: string, options: CookieOptions = {}): void => {
  res.cookie(name, '', {
    ...defaultOptions,
    ...options,
    maxAge: 0
  });
};
