import { autoInjectable } from 'tsyringe';

@autoInjectable()
export class AuthService {
  constructor() { }

  async login() {
    return 'Test';
  }
}
