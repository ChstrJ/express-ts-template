import { autoInjectable } from 'tsyringe';
import { AuthService } from './auth.service';

@autoInjectable()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  async login(req: any, res: any) {
    const data = req.body;
    console.log(data);
    const result = data;
    return res.json();
  }
}
