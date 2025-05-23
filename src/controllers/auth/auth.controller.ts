import { AuthService } from "@root/services/auth/auth.service";
import { autoInjectable } from "tsyringe";

@autoInjectable()
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  async login(req: any, res: any) {
    const data = await this.authService.login();
    return res.json({ data: data })
  }
}
