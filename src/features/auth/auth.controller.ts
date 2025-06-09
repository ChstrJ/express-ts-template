import { Request, Response } from 'express';
import { injectable, inject, singleton } from 'tsyringe';
import { AuthService } from './auth.service';
import logger from '@utils/logger';

@singleton()
@injectable()
export class AuthController {
  constructor(@inject(AuthService) private authService: AuthService) {} // authService will be injected by tsyringe

  async login(req: Request, res: Response) {
    // No longer need to check if authService is initialized due to non-optional injection
    try {
      const result = await this.authService.login(req);
      // Add your response logic based on the result
      return res.status(200).json(result);
    } catch (error) {
      logger.error('Login error:', error);
      return res.status(500).json({ message: 'Internal server error during login' });
    }
  }

  async register(req: Request, res: Response) {
    // No longer need to check if authService is initialized
    try {
      const result = await this.authService.register(req);
      // Add your response logic based on the result
      if (result) {
        return res.status(201).json({ message: 'User registered successfully' });
      } else {
        return res.status(400).json({ message: 'User registration failed' });
      }
    } catch (error) {
      logger.error('Register error:', error);
      return res.status(500).json({ message: 'Internal server error during registration' });
    }
  }

  async test(req: Request, res: Response) {
    logger.info('AuthController test method called');
    // No longer need to check if authService is initialized
    logger.info('AuthService is available in AuthController (assumed due to non-optional constructor), calling its test method.');
    const result = await this.authService.test(req);
    return res.status(200).json(result);
  }
}
