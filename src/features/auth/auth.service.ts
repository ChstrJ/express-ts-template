import { authRepository } from './auth.repository';
import { Request } from 'express';

export const authService = {
  async login(req: Request) {
    const body = req.body;
    const data = await authRepository.findByEmail(body.email)
    return data;
  }
}
