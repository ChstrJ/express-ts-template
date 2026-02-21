import { Request, Response } from 'express';
import { walletService } from './wallet.service';

export const walletController = {
  async listWallets(req: Request, res: Response) {
    const { data, meta } = await walletService.getWallets(req.query);
    res.json({ data, meta });
  },

  async listTransactionHistory(req: Request, res: Response) {
    const { account_id } = req.user;
    const { data, meta } = await walletService.getAllTransactionHistory(account_id, req.query);
    res.json({ data, meta });
  },

  async getWallet(req: Request, res: Response) {
    const { account_id } = req.user;
    const data = await walletService.findWallet(account_id);
    res.json({ data });
  },

  async requestCashout(req: Request, res: Response) {
    const { account_id } = req.user;
    await walletService.requestCashout(account_id, req.body.amount);
    res.json({ message: 'Withdrawal request sent successfully.' });
  },
};