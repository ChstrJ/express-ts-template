import { AuthService } from "@root/services/auth/auth.service";
import { autoInjectable } from "tsyringe";

@autoInjectable()
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  async login(req: any, res: any) {
    const { accessToken, refreshToken } = await this.authService.login(req);

    return res.json({
      access_token: accessToken,
      refresh_token: refreshToken
    })
  }
}
