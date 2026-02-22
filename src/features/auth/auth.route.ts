import { Router } from 'express';
import { authController } from './auth.controller';
import { loginSchema } from '@common/schema/auth';
import { validateRequest } from '@middlewares/validator';

const router = Router();

router.post('/login', validateRequest(loginSchema), authController.login);

export default router;
