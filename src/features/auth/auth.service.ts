import { authRepository } from './auth.repository';

export const authService = {
  async login(req) {
    const body = req.body;
    const data = await authRepository.findByEmail(body.email)
    const testDaata = await authRepository.findById('0c106e05-b906-43b2-8bfb-1d46bc793c2b');
    return data;
  }
}
