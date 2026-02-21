import { Request, Response } from 'express';
import { resetService } from '@features/reset/reset.service';

export const resetController = {
  async masterReset(req: Request, res: Response) {
    const data = await resetService.masterReset()

    res.json({ message: data.message })
  },

  async productReset(req: Request, res: Response) {
    const data = await resetService.resetProducts()

    res.json({ message: data.message })
  },

  async salesReset(req: Request, res: Response) {
    const data = await resetService.resetSales();

    res.json({ message: data.message })
  },

  async distributorsReset(req: Request, res: Response) {
    const data = await resetService.resetDistributors();

    res.json({ message: data.message })
  }
};
