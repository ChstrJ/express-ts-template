import { Router } from 'express';
import authRoutes from '@features/auth/auth.route';

import { authenticationMiddleware } from '@middlewares/authentication';

const router = Router();

// Public routes
router.use('/auth', authRoutes);

// Protected routes
router.use(authenticationMiddleware);

export default router;
