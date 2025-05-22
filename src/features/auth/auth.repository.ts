import { autoInjectable } from 'tsyringe';

@autoInjectable()
export class AuthRepository {
  async findEmail() {
    return 'Success!';
  }
}
