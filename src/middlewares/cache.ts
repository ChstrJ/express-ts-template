import { cache } from "@utils/cache"
import { Request, Response, NextFunction } from 'express';

export const publicCache = (key: string) => async (req: Request, res: Response, next: NextFunction) => {
  const cached = await cache.get(key);

  if (cached) {
    res.json(JSON.parse(cached))
  }

  next();
}

export const protectedCache = (key: string) => async (req: Request, res: Response, next: NextFunction) => {
  let formattedKey = `${key}:${req.user.account_id}`;

  const cached = await cache.get(formattedKey);

  if (cached) {
    res.json(JSON.parse(cached))
  }

  next();
}
