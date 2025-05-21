import { Router } from 'express';
import { container } from 'tsyringe';
import { AuthController } from './auth.controller';

const router = Router();
const authController = container.resolve.bind(AuthController);

router.get('/login', authController.login)


export default router;
