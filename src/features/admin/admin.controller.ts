import { Request, Response } from 'express';
import { adminService } from './admin.service';
import { StatusCodes } from 'http-status-codes';
import { commissionService } from '@features/commission/commission.service';
import dayjs from 'dayjs';
import db from 'src/db/db-client';
import { Status } from '@common/constants/status';
import { teamService } from '@features/team/team.service';
import { getCurrentMonthRange } from '@utils/date';
import { RankType } from '@utils/types';

export const adminController = {
  async setAccountStatus(req: Request, res: Response) {
    const { accountId } = req.params;
    const { account_id: adminId } = req.user;

    const data = await adminService.setAccountStatus(adminId, accountId, req.body);

    res.json({ data: data });
  },

  async setOrderStatus(req: Request, res: Response) {
    const { orderId } = req.params;
    const { account_id: adminId } = req.user;
    const { status } = req.body;

    const data = await adminService.setOrderStatus(adminId, orderId, status);

    res.json({ data: data });
  },

  async setOrderPaymentStatus(req: Request, res: Response) {
    const { orderId } = req.params;
    const { account_id: adminId } = req.user;
    const { status } = req.body;

    const data = await adminService.setOrderPaymentStatus(adminId, orderId, status);

    res.json({ data: data });
  },

  async listPendingDistributors(req: Request, res: Response) {
    const { data, meta } = await adminService.listPendingDistributors(req.query);

    res.json({ data: data, meta: meta });
  },

  async listRejectedDistributors(req: Request, res: Response) {
    const { data, meta } = await adminService.listRejectedDistributors(req.query);

    res.json({ data: data, meta: meta });
  },

  async listDistributors(req: Request, res: Response) {
    const { data, meta } = await adminService.listDistributors(req.query);

    res.json({ data: data, meta: meta });
  },

  async listNetworkTreeByDistributor(req: Request, res: Response) {
    const { accountId } = req.params;
    const data = await adminService.listNetworkByAccountId(accountId);

    res.json({ data: data });
  },

  async createLevel(req: Request, res: Response) {
    const { account_id: adminId } = req.user;
    const data = await adminService.createLevel(adminId, req.body);

    res.json({ data: data });
  },

  async listAllLevels(req: Request, res: Response) {
    const data = await adminService.listLevels();

    res.json({ data: data });
  },

  async updateLevel(req: Request, res: Response) {
    const { levelId } = req.params;
    const { account_id: adminId } = req.user;

    const data = await adminService.updateLevel(adminId, levelId, req.body);

    res.json({ data: data });
  },

  async deleteLevel(req: Request, res: Response) {
    const { levelId } = req.params;
    const { account_id: adminId } = req.user;

    const data = await adminService.deleteLevel(adminId, levelId);

    res.json({ data: data });
  },

  async dashboardStats(req: Request, res: Response) {
    const { totalSales, totalCommission, totalCPQ, totalUsers, activeDistributors, totalReleased, totalUnreleased } = await adminService.getDashboardStats();

    res.json({
      total_sales: totalSales,
      total_commission: totalCommission,
      total_users: totalUsers,
      active_distributors: activeDistributors,
      total_released: totalReleased,
      total_unreleased: totalUnreleased,
      total_cpq: totalCPQ
    });
  },

  async createAdmin(req: Request, res: Response) {
    const data = await adminService.createAdmin(req.body);

    res.status(StatusCodes.CREATED).json({ data: data });
  },

  async listAdmins(req: Request, res: Response) {
    const { data, meta } = await adminService.listAdmins(req.query);

    res.json({ data: data, meta: meta });
  },

  async updateAdminPermission(req: Request, res: Response) {
    const data = await adminService.updatePermission(req.params.accountId, req.body);

    res.json({ data: data });
  },

  async setWithdrawStatus(req: Request, res: Response) {
    const { withdrawalId } = req.params;
    const { account_id: adminId } = req.user;

    await adminService.setWithdrawalStatus(adminId, withdrawalId, req.body);

    res.json({ message: 'Withdrawal status updated successfully.' });
  },

  async setLockStockThreshold(req: Request, res: Response) {
    const { account_id: adminId } = req.user;
    const { threshold } = req.body;

    await adminService.setLowStockThreshold(adminId, threshold);

    res.json({ message: 'Low stock threshold updated successfully.' });
  },

  async getLowStockThreshold(req: Request, res: Response) {
    const data = await adminService.getLowStockThreshold();

    res.json({ data: data });
  },

  async setMinWithdrawAmount(req: Request, res: Response) {
    const { amount } = req.body;
    const { account_id: adminId } = req.user;
    await adminService.setMinWithdrawAmount(adminId, amount);

    res.json({ message: 'Minimum withdrawal amount updated successfully.' });
  },

  async setMaxCashoutPerDay(req: Request, res: Response) {
    const { times } = req.body;
    const { account_id: adminId } = req.user;

    const data = await adminService.setMaxCashoutPerDay(adminId, times);

    res.json({ data });
  },

  async getMaxCashoutPerDay(req: Request, res: Response) {
    const data = await adminService.getMaxCashoutPerDay();

    res.json({ data });
  },

  async setRequiredPv(req: Request, res: Response) {
    const { pv } = req.body;
    const { account_id: adminId } = req.user;

    const data = await adminService.setRequiredPv(adminId, pv);

    res.json({ data });
  },

  async getRequiredPv(req: Request, res: Response) {
    const data = await adminService.getRequiredPv();

    res.json({ data });
  },

  async getMinWithdrawAmount(req: Request, res: Response) {
    const data = await adminService.getMinWithdrawAmount();

    res.json({ data: data });
  },

  async topReferrals(req: Request, res: Response) {
    const data = await adminService.topReferrals(req.query);

    res.json({ data: data });
  },

  async topCommissions(req: Request, res: Response) {
    const data = await adminService.topCommissions(req.query);

    res.json({ data: data });
  },

  async listChatHistory(req: Request, res: Response) {
    const { accountId } = req.params;
    const { data, meta } = await adminService.getChatHistory(accountId, req.query);

    res.json({ data: data, meta: meta });
  },

  async getChat(req: Request, res: Response) {
    const { accountId } = req.params;

    const { data, meta } = await adminService.getChat(accountId, req.query);

    res.json({ data: data, meta: meta });
  },

  async assignCsrToTicket(req: Request, res: Response) {
    const { ticketId } = req.params;
    const { csr_id: csrId } = req.body;
    const { account_id: adminId } = req.user;

    const data = await adminService.assignCsrToTicket(adminId, ticketId, csrId);

    res.json({ data: data });
  },

  async setTicketStatus(req: Request, res: Response) {
    const { ticketId } = req.params;
    const { account_id: adminId } = req.user;

    const data = await adminService.setTicketStatus(adminId, ticketId, req.body.status);

    res.json({ data: data });
  },

  async createRank(req: Request, res: Response) {
    const { account_id: adminId } = req.user;

    const data = await adminService.createRank(adminId, req.body);

    res.json({ data });
  },

  async updateRank(req: Request, res: Response) {
    const { account_id: adminId } = req.user;

    const data = await adminService.updateRank(adminId, req.body, req.params.id);

    res.json({ data });
  },

  async deleteRank(req: Request, res: Response) {
    const { account_id: adminId } = req.user;

    const data = await adminService.deleteRank(adminId, req.params.id);

    res.json({ data });
  },

  async getRanks(req: Request, res: Response) {
    const data = await adminService.getRankSettings();

    res.json({ data: data });
  },

  async viewWallets(req: Request, res: Response) {
    const { data, meta } = await adminService.viewWallet(req.query);

    res.json({ data: data, meta: meta });
  },

  async viewWalletHistory(req: Request, res: Response) {
    const { data, meta } = await adminService.viewWalletHistory(req.params.accountId, req.query);

    res.json({ data: data, meta: meta });
  },

  async viewFiles(req: Request, res: Response) {
    const { type } = req.query;

    const data = await adminService.listDocuments(type as string);

    res.json({ data: data });
  },

  async uploadFile(req: Request, res: Response) {
    await adminService.uploadDocuments(req.file as Express.Multer.File, req.body);

    res.json({ message: 'File uploaded successfully.' });
  },

  async deleteFile(req: Request, res: Response) {
    const { fileId } = req.params;
    await adminService.deleteDocuments(fileId);

    res.json({ message: 'File deleted successfully.' });
  },

  async sidebarStatus(req: Request, res: Response) {
    res.json(await adminService.sidebarStatus(req.user.account_id));
  },

  async triggerDisburseUnreleasedCommission(req: Request, res: Response) {
    const { startOfMonth, endOfMonth } = getCurrentMonthRange();
    const ranks = await teamService.getRanks();
    await teamService.snapshotRanks(ranks, startOfMonth, endOfMonth);
    await commissionService.releaseOnHoldCommissions(ranks as RankType[], startOfMonth, endOfMonth);

    res.json(true)
  },

  async releaseBonus(req: Request, res: Response) {
    const ranks = await teamService.getRanks();
    const { startOfMonth, endOfMonth } = getCurrentMonthRange();
    await teamService.snapshotMonthlyRanks(ranks, startOfMonth, endOfMonth, true);
    await commissionService.releaseBonus(ranks as RankType[], startOfMonth, endOfMonth, true);

    res.json(true)
  },

  async uploadPickupProof(req: Request, res: Response) {
    res.json(await adminService.uploadPickupProof(req.params.orderId, req.file as Express.Multer.File));
  },

  async viewPickupProof(req: Request, res: Response) {
    const { orderId } = req.params;

    const data = await adminService.viewPickupProof(orderId);

    res.json({ data });
  },
};
