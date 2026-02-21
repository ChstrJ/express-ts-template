import { Router } from 'express';
import { reportsController } from './reports.controller';

const router = Router();

router.get('/', reportsController.getReports);

router.get('/orders/export', reportsController.exportOrdersReport);
router.get('/orders', reportsController.getOrdersReport);

router.get('/users/export', reportsController.exportUsersReport);
router.get('/users', reportsController.getUsersReport);

router.get('/products/export', reportsController.exportProductsReport);
router.get('/products/low-stock/export', reportsController.exportProductsReport);
router.get('/products/low-stock', reportsController.getLowStockProducts);

router.get('/commissions', reportsController.getCommissions);
router.get('/commissions/export', reportsController.exportCommissionsReport);
router.get('/commissions/unreleased/export', reportsController.exportUnreleasedCommissionReport);
router.get('/commissions/unreleased', reportsController.getUnreleasedCommissions);

router.get('/inactive-members', reportsController.getInactiveMembers);
router.get('/inactive-members/export', reportsController.exportInactiveMembers);

router.get('/genealogy/:accountId/export', reportsController.exportGenealogyReport);
router.get('/genealogy/:accountId', reportsController.getGenealogy);

router.get('/withdrawals/export', reportsController.exportWithdrawalsReport);
router.get('/sales-packages/export', reportsController.exportPackageSales);
router.get('/sales-products/export', reportsController.exportProductSales);
router.get('/sales-products', reportsController.getProductSales);

router.get('/inventory/export', reportsController.exportProductStockHistory);
router.get('/inventory', reportsController.getProductStockHistory);

export default router;
