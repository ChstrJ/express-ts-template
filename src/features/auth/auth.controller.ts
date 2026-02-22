import { Request, Response } from 'express';
import { authService } from './auth.service';

export const authController = {
  async login(req: Request, res: Response) {
    const data = await authService.login(req);
  }
};
