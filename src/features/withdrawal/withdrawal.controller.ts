import { Request, Response } from 'express';
import { withdrawalService } from './withdrawal.service';

export const withdrawalController = {
  async getWithdrawals(req: Request, res: Response) {
    const { data, meta } = await withdrawalService.listWithdrawals(req.query);
    res.json({ data, meta });
  },

  async withdrawalStats(req: Request, res: Response) {
    const { totalPending, totalProcessing, totalCompleted } = await withdrawalService.withdrawalStats();

    res.json({
      total_pending: totalPending,
      total_processing: totalProcessing,
      total_completed: totalCompleted,
    });
  },

  async getWithdrawal(req: Request, res: Response) {
    const { withdrawalId } = req.params;
    const data = await withdrawalService.findWithdrawal(withdrawalId);
    res.json({ data });
  },
};