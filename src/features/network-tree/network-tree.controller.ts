import { networkTreeService } from '@features/network-tree/network-tree.service';
import { Request, Response } from 'express';

export const networkTreeController = {
  async listNetwork(req: Request, res: Response) {
    const { account_id } = req.user;

    const data = await networkTreeService.listNetworkAndFormat(account_id);

    res.json({ data: data });
  }
};
