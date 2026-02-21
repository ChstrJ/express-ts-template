import { Router } from 'express';
import { salesController } from './sales.controller';
import permissionMiddleware from '@middlewares/permission';

const router = Router();

router.use(permissionMiddleware('sales'));
router.get('/', salesController.listSales);
router.get('/total', salesController.getSalesStats);

router.get('/packages', salesController.listPackageSales);
router.get('/packages/export', salesController.exportPackageSales);

router.get('/products', salesController.listProductSales);
router.get('/products/export', salesController.exportProductSales);

export default router;
