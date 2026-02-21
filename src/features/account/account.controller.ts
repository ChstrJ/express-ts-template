import { Request, Response } from 'express';
import { adminService } from '@features/admin/admin.service';
import { referralCodeService } from '@features/referral-code/referral-code.service';
import { accountService } from './account.service';
import { teamService } from '@features/team/team.service';
import { networkTreeService } from '@features/network-tree/network-tree.service';
import { getCurrentMonthRange } from '@utils/date';
import { generateMeta } from '@utils/pagination';
import { RankType } from '@utils/types';

export const accountController = {
  async getReferralCount(req: Request, res: Response) {
    const { account_id } = req.user;

    const { resultsTotalCount, resultsMonthlyCount } = await referralCodeService.getReferralCount(account_id);

    res.json({
      data: {
        total_count: resultsTotalCount,
        monthly_count: resultsMonthlyCount
      }
    });
  },

  async listNotifications(req: Request, res: Response) {
    const { account_id } = req.user;

    const { data, meta } = await accountService.listNotifications(account_id, req.query);

    res.json({ data: data, meta: meta });
  },

  async bulkReadNotifications(req: Request, res: Response) {
    const { account_id } = req.user;

    const data = await accountService.bulkReadNotifications(account_id);

    res.json({ data });
  },

  async readNotification(req: Request, res: Response) {
    const { notifId } = req.params;

    await accountService.readNotification(notifId, 1);

    res.json({ data: true });
  },

  async editAccount(req: Request, res: Response) {
    const { accountId } = req.params;
    const file = req.file as Express.Multer.File;

    await accountService.editAccount(accountId, req.body, file);

    res.json({ data: true });
  },

  async addPaymentMethod(req: Request, res: Response) {
    const { account_id } = req.user;
    const file = req.file as Express.Multer.File;

    await accountService.addPaymentMethod(account_id, req.body, file);

    res.json({ data: true });
  },

  async updatePaymentMethod(req: Request, res: Response) {
    const { account_id } = req.user;
    const file = req.file as Express.Multer.File;
    await accountService.changePaymentMethod(account_id, req.body, file);

    res.json({ message: 'Payment method updated successfully.' });
  },

  async getPaymentMethod(req: Request, res: Response) {
    const { account_id } = req.user;

    const data = await accountService.getPaymentMethod(account_id);

    res.json({ data: data });
  },

  async topReferrals(req: Request, res: Response) {
    const { account_id } = req.user;
    const data = await accountService.topReferrals(account_id, req.query);

    res.json({ data: data });
  },

  async topCommissions(req: Request, res: Response) {
    const { account_id } = req.user;
    const data = await accountService.topCommissions(account_id, req.query);

    res.json({ data: data });
  },

  async getMinWithdrawAmount(req: Request, res: Response) {
    const data = await adminService.getMinWithdrawAmount();

    res.json({ data: data });
  },

  async getTickets(req: Request, res: Response) {
    const { account_id, account_role } = req.user;

    const { data, meta } = await accountService.getTickets(account_id, req.query, account_role);

    res.json({ data: data, meta: meta });
  },

  async getTeamMembers(req: Request, res: Response) {
    const { account_id } = req.user;

    const { team_name, data, rank, total_gv } = await teamService.listTeamMembersV3(account_id);

    res.json({ team_name, rank, total_gv, data });
  },

  async getTeamMembersTreeView(req: Request, res: Response) {
    const { account_id } = req.user;

    const data = await teamService.getTeamViewAndRanks(account_id);

    res.json({ data });
  },

  async getRanks(req: Request, res: Response) {
    const data = await accountService.getRanks();

    res.json({ data: data });
  },

  async getDashboardStats(req: Request, res: Response) {
    const { account_id } = req.user;

    const {
      grandTotalCommission,
      sumPackageCommission,
      sumProductCommission,
      sumLastMonthPackageCommission,
      sumLastMonthProductCommission,
      sumMonthlyPackageCommission,
      sumMonthlyProductCommission,
      totalCpq,
      teamName,
      rankName,
      totalGv
    } = await accountService.getDashboardStats(account_id);

    res.json({
      data: {
        grand_total_commission: grandTotalCommission,
        total_package_commission: sumPackageCommission,
        total_product_commission: sumProductCommission,
        last_month_package_commission: sumLastMonthPackageCommission,
        last_month_product_commission: sumLastMonthProductCommission,
        monthly_package_commission: sumMonthlyPackageCommission,
        monthly_product_commission: sumMonthlyProductCommission,
        rank: rankName,
        total_gv: totalGv,
        team_name: teamName,
        total_cpq: totalCpq
      }
    });
  },

  async getMaxCashoutPerDay(req: Request, res: Response) {
    const data = await accountService.getMaxCashoutPeraday()
    res.json({ data })
  },

  async getGv(req: Request, res: Response) {
    const { startOfMonth, endOfMonth } = getCurrentMonthRange();
    const ranks = await teamService.getRanks();

    const rank = await teamService.computePvAndGvWithLegCap(req.user.account_id, ranks as RankType[], startOfMonth, endOfMonth);

    res.json({ total_pv: rank?.pv, total_gv: rank?.capped_gv, rank: rank.ranks_name });
  },

  async resetPassword(req: Request, res: Response) {
    const { account_id } = req.user;
    const { old_password, new_password } = req.body;

    const data = await accountService.resetPassword(account_id, old_password, new_password);
    res.json({ data })
  },

  async sidebarStatus(req: Request, res: Response) {
    return res.json(await accountService.sidebarStatus(req.user.account_id))
  }
}
