import { Router } from 'express';
import { resetController } from './reset.controller';

const router = Router();

// Add reset routes here
router.delete('/master', resetController.masterReset)
router.delete('/distributors', resetController.distributorsReset)
router.delete('/products', resetController.productReset)
router.delete('/sales', resetController.salesReset)

export default router;
