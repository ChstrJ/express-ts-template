import { autoInjectable } from 'tsyringe';
import { AuthRepository } from './auth.repository';

@autoInjectable()
export class AuthService {

  constructor(private readonly authRepository: AuthRepository) { }

  async login(data: any) {
    console.log(data)
    return this.authRepository.findEmail()
  }

}
