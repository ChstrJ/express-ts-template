import { Request, Response } from 'express';

export interface CookieOptions {
  maxAge?: number;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
  path?: string;
}

const defaultOptions: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
};

export const setCookie = (
  res: Response,
  name: string,
  value: string,
  options: CookieOptions = {}
): void => {
  res.cookie(name, value, { ...defaultOptions, ...options });
};

export const getCookie = (req: Request, name: string): string | undefined => {
  return req.cookies?.[name];
};

export const clearCookie = (
  res: Response,
  name: string,
  options: CookieOptions = {}
): void => {
  res.clearCookie(name, { ...defaultOptions, ...options });
};

