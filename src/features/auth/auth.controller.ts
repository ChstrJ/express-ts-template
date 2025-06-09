import { Request, Response } from 'express';
import { AuthService, authService } from './auth.service';
import { permissions } from '@root/config/permission';
import { StatusCodes } from 'http-status-codes';
import { autoInjectable } from 'tsyringe';

export const authController = {
  async login(req: Request, res: Response) {
    const data = await authService.login(req);
    return res.json({ data: data })
  },

  async register(req: Request, res: Response) {
    const data = await authService.register(req)
    return res.json({ data: data })
  }
}

@autoInjectable()
export class AuthController {

  constructor(protected authService?: AuthService) { }

  async login(req: Request, res: Response) {
    const data = await this.authService?.login(req);
    return res.json({ data: data })
  }

  async register(req: Request, res: Response) {
    const data = await this.authService?.register(req)
    return res.json({ data: data })
  }

  async test(req, res) {
    const data = await this.authService?.register(req)
    console.log(data)
    return res.json(data)
  }
}
