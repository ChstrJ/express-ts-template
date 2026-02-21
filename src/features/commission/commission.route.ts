import { Router } from 'express';
import { commissionController } from './commission.controller';

const router = Router();

router.get('/', commissionController.listCommissions);
router.get('/distributor/:accountId', commissionController.listCommissionsByDistributor);
router.get('/total', commissionController.totalCommissions);

export default router;
