import { Router } from 'express';
import { authController } from './auth.controller';
import { loginSchema, registerSchema } from '@common/schema/auth';
import { validateRequest } from '@middlewares/validator';
import { authenticationMiddleware } from '@middlewares/authentication';

const router = Router();

router.post('/login', validateRequest(loginSchema), authController.login);
router.post('/register', validateRequest(registerSchema), authController.register);
router.post('/logout', authenticationMiddleware, authController.logout);
router.post('/refresh', authController.refreshToken);
router.get('/session', authenticationMiddleware, authController.session);
router.get('/ably', authenticationMiddleware, authController.ablyAuth);

export default router;
