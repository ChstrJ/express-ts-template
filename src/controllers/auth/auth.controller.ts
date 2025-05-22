import { autoInjectable } from 'tsyringe';

@autoInjectable()
export class AuthController {
  constructor() { }

  async login(req: any, res: any) {
    return res.json(req.body);
  }
}
