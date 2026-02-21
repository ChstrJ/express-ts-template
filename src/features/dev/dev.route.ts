import { Router } from 'express';
import { devController } from './dev.controller';

const router = Router();

router.post('/account', devController.createAccount);
router.post('/login', devController.login);
router.post('/change-pass', devController.changePassword);

export default router;
