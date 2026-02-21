import { Router } from 'express';
import authRoutes from '@features/auth/auth.route';
import productsRoutes from '@features/products/products.route';
import networkTreeRoutes from '@features/network-tree/network-tree.route';
import referralCodeRoutes from '@features/referral-code/referral-code.route';
import productPackageRoutes from '@features/product-package/product-package.route';
import accountRoutes from '@features/account/account.route';
import accountActivityRoutes from '@features/account-activity/account-activity.route';
import devRoutes from '@features/dev/dev.route';
import orderRoutes from '@features/order/order.route';
import adminRoutes from '@features/admin/admin.route';
import commissionRoutes from '@features/commission/commission.route';
import salesRoutes from '@features/sales/sales.route';
import productCategoryRoutes from '@features/product-category/product-category.route';
import paymentRoutes from '@features/payment/payment.route';
import walletRoutes from '@features/wallet/wallet.route';
import withdrawalRoutes from '@features/withdrawal/withdrawal.route';
import chatRoutes from '@features/chat/chat.route';
import reportRoutes from '@features/reports/reports.route';
import ticketRoutes from '@features/ticket/ticket.route';
import smsRoutes from '@features/sms/sms.route';
import emailRoutes from '@features/email/email.route';
import teamRoutes from '@features/team/team.route';
import resetRoutes from '@features/reset/reset.route';

import { authenticationMiddleware } from '@middlewares/authentication';
import { adminMiddleware } from '@middlewares/admin';
import { roleMiddleware } from '@middlewares/role';
import { Role } from '@common/constants/roles';
import { sanitize } from '@middlewares/sanitize';
import { maintenance } from '@middlewares/maintenance';

const router = Router();

router.use(sanitize);

// Public routes
router.use('/auth', authRoutes);
router.use('/product-package', productPackageRoutes);

// Protected routes
router.use(authenticationMiddleware);
router.use('/products', productsRoutes);
router.use('/referral-code', referralCodeRoutes);
router.use('/network-tree', networkTreeRoutes);
router.use('/account', accountRoutes);
router.use('/orders', orderRoutes);
router.use('/commissions', commissionRoutes);
router.use('/payment', paymentRoutes);
router.use('/wallet', walletRoutes);
router.use('/chat', chatRoutes);
router.use('/tickets', ticketRoutes);

router.use(roleMiddleware(Role.ADMIN_ROLES));
router.use('/dev', devRoutes);
router.use('/admin', adminRoutes);
router.use('/activity', accountActivityRoutes);
router.use('/sms', smsRoutes);
router.use('/email', emailRoutes);
router.use('/withdrawal', withdrawalRoutes);
router.use('/sales', salesRoutes);
router.use('/teams', teamRoutes);
router.use('/product-category', productCategoryRoutes);
router.use('/reports', reportRoutes);
router.use('/reset', resetRoutes);

export default router;
