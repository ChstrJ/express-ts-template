import { AuthService } from "@root/services/auth/auth.service";
import { autoInjectable } from "tsyringe";
import { Request, Response } from "express";

@autoInjectable()
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  async login(req: Request, res: Response) {
    const { accessToken, refreshToken } = await this.authService.login(req);

    return res.json({
      access_token: accessToken,
      refresh_token: refreshToken,
    })
  }
}
