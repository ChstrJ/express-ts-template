import { Router } from 'express';
import { accountController } from './account.controller';
import { validateRequest } from '@middlewares/validator';
import {
  accountPaymentMethod,
  accountUpdatePaymentMethodSchema,
  resetPassword,
  updateAccountSchema
} from '@common/schema/account';
import { uploadAndProcessFile } from '@middlewares/upload-image';

const router = Router();

// Referral
router.get('/referrals-count', accountController.getReferralCount);

// Tickets
router.get('/tickets', accountController.getTickets);

// Members
router.get('/members', accountController.getTeamMembers);
router.get('/members/tree-view', accountController.getTeamMembersTreeView);
router.get('/ranks', accountController.getRanks);

// Account
router.patch('/reset-password', validateRequest(resetPassword), accountController.resetPassword);
router.patch(
  '/:accountId',
  uploadAndProcessFile('image'),
  validateRequest(updateAccountSchema),
  accountController.editAccount
);

// Status
router.get('/dashboard/stats', accountController.getDashboardStats);
router.get('/sidebar-status', accountController.sidebarStatus);

router.get('/top-referrals', accountController.topReferrals);
router.get('/top-commissions', accountController.topCommissions);

// Notifs
router.get('/notifs', accountController.listNotifications);
router.post('/notifs/read/:notifId', accountController.readNotification);
router.post('/notifs/read/bulk', accountController.bulkReadNotifications);

// Settings
router.get('/setting/min-withdraw', accountController.getMinWithdrawAmount);
router.get('/setting/max-cashout', accountController.getMaxCashoutPerDay);
router.get('/gv', accountController.getGv);

// Payment method
router.get('/payment-method', accountController.getPaymentMethod);
router.post(
  '/payment-method',
  uploadAndProcessFile('image'),
  validateRequest(accountPaymentMethod),
  accountController.addPaymentMethod
);
router.patch(
  '/payment-method',
  uploadAndProcessFile('image'),
  validateRequest(accountUpdatePaymentMethodSchema),
  accountController.updatePaymentMethod
);

export default router;
