import { Request, Response } from 'express';
import { accountActivityService } from './account-activity.service';

export const accountActivityController = {
  async getAccountActivities(req: Request, res: Response) {
    const { data, meta } = await accountActivityService.getAccountActivities(req.query);
    res.json({ data, meta });
  }
};
