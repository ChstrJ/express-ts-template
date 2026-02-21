import { Router } from 'express';
import { withdrawalController } from './withdrawal.controller';

const router = Router();

router.get('/', withdrawalController.getWithdrawals);
router.get('/stats', withdrawalController.withdrawalStats);
router.get('/:withdrawalId', withdrawalController.getWithdrawal);

export default router;
