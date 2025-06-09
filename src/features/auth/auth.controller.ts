import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { injectable, singleton, inject } from 'tsyringe';

@singleton()
@injectable()
export class AuthController {

  constructor(@inject(AuthService) protected authService: AuthService) { }

  async login(req: Request, res: Response) {
    const data = await this.authService.login(req);
    return res.json({ data: data })
  }

  async register(req: Request, res: Response) {
    const data = await this.authService.register(req)
    return res.json({ data: data })
  }
}
