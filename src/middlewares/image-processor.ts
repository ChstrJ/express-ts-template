import { NextFunction, Request, Response } from 'express';

export const processImage = (fieldName: string) => (req: Request, res: Response, next: NextFunction) => {
  if (req.file) {
    req.body[fieldName] = req.file;
  }
  next();
};
