import { Router } from 'express';
import { adminController } from './admin.controller';
import { validateRequest } from '@middlewares/validator';
import { levelSchema, updateLevelSchema } from '@common/schema/levels';
import { orderStatus } from '@common/schema/orders';
import { accountStatus } from '@common/schema/account';
import { createAdminSchema, updateAdminSchema } from '@common/schema/permissions';
import { orderPaymentStatus } from '@common/schema/payment';
import { withdrawStatus } from '@common/schema/wallet';
import { csrIdSchema, ticketStatus } from '@common/schema/ticket';
import { rankSchema, updateRank } from '@common/schema/ranks';
import { minWithdrawAmount, pv, threshold, times } from '@common/schema/settings';
import { uploadAndProcessFile } from '@middlewares/upload-image';
import { filesSchema } from '@common/schema/files';
import { imageSchema } from '@common/schema/multipart';

const router = Router();

// Accounts
router.get('/pending-distributors', adminController.listPendingDistributors);
router.get('/rejected-distributors', adminController.listRejectedDistributors);
router.get('/accounts', adminController.listDistributors);
router.get('/account/:accountId/network-tree', adminController.listNetworkTreeByDistributor);
router.post('/account/:accountId/status', validateRequest(accountStatus), adminController.setAccountStatus);
router.post('/', validateRequest(createAdminSchema), adminController.createAdmin);
router.get('/', adminController.listAdmins);
router.patch('/permission/:accountId', validateRequest(updateAdminSchema), adminController.updateAdminPermission);

// Orders
router.post('/order/:orderId/status', validateRequest(orderStatus), adminController.setOrderStatus);
router.post('/payment/:orderId/status', validateRequest(orderPaymentStatus), adminController.setOrderPaymentStatus);
router.get('/pickup/:orderId', validateRequest(orderPaymentStatus), adminController.viewPickupProof);
router.post('/pickup/:orderId',
    uploadAndProcessFile('image'),
    validateRequest(imageSchema),
    adminController.uploadPickupProof
);

// Withdrawal
router.post('/withdrawal/:withdrawalId/status', validateRequest(withdrawStatus), adminController.setWithdrawStatus);

// Chat
router.get('/chat/:accountId', adminController.getChat);
router.get('/chat/:accountId/history', adminController.listChatHistory);
router.post('/chat-support/:ticketId', validateRequest(csrIdSchema), adminController.assignCsrToTicket);

// Ticket
router.post('/ticket/:ticketId', validateRequest(ticketStatus), adminController.setTicketStatus);

// Wallet
router.get('/wallet', adminController.viewWallets);
router.get('/wallet-history/:accountId', adminController.viewWalletHistory);

// Settings
router.post('/setting/levels', validateRequest(levelSchema), adminController.createLevel);
router.get('/setting/levels', adminController.listAllLevels);
router.patch('/setting/levels/:levelId', validateRequest(updateLevelSchema), adminController.updateLevel);
router.delete('/setting/levels/:levelId', adminController.deleteLevel);
router.post('/setting/min-withdraw', validateRequest(minWithdrawAmount), adminController.setMinWithdrawAmount);
router.get('/setting/min-withdraw', adminController.getMinWithdrawAmount);
router.post('/setting/max-cashout', validateRequest(times), adminController.setMaxCashoutPerDay);
router.get('/setting/max-cashout', adminController.getMaxCashoutPerDay);
router.post('/setting/low-stock', validateRequest(threshold), adminController.setLockStockThreshold);
router.get('/setting/low-stock', adminController.getLowStockThreshold);
router.post('/setting/required-pv', validateRequest(pv), adminController.setRequiredPv);
router.get('/setting/required-pv', adminController.getRequiredPv);
router.post('/setting/files', uploadAndProcessFile('file'), validateRequest(filesSchema), adminController.uploadFile);
router.get('/setting/files', adminController.viewFiles);
router.delete('/setting/files/:fileId', adminController.deleteFile);

router.post('/setting/rank', validateRequest(rankSchema), adminController.createRank);
router.patch('/setting/rank/:id', validateRequest(updateRank), adminController.updateRank);
router.delete('/setting/rank/:id', adminController.deleteRank);
router.get('/setting/rank', adminController.getRanks);

// Dashboard
router.get('/dashboard/stats', adminController.dashboardStats);

// Leaderboard
router.get('/top-referrals', adminController.topReferrals);
router.get('/top-commissions', adminController.topCommissions);

// Sidebar
router.get('/sidebar-status', adminController.sidebarStatus);

// Test
router.get('/disburse-unreleased-commission', adminController.triggerDisburseUnreleasedCommission);
router.get('/release-bonus', adminController.releaseBonus);

export default router;
