import { autoInjectable } from 'tsyringe';
import { AuthRepository } from './auth.repository';

@autoInjectable()
export class AuthService {

  constructor(private readonly authRepository: AuthRepository) { }

  async login() {
    return this.authRepository.findEmail()
  }

}
