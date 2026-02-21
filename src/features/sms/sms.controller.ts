import { Request, Response } from 'express';
import { smsService } from './sms.service';

export const smsController = {
  async getSmsTemplate(req: Request, res: Response) {
    const data = await smsService.getSmsTemplates();
    res.json({ data });
  },

  getSmsVars(req: Request, res: Response) {
    const data = smsService.getSmsVars();
    res.json({ data });
  },

  getSmsTypes(req: Request, res: Response) {
    const data = smsService.getSmsTypes(req.query);
    res.json({ data });
  },

  async createSmsTemplate(req: Request, res: Response) {
    const data = await smsService.createSmsTemplate(req.body);
    res.json({ data: data });
  },

  async updateSmsTemplate(req: Request, res: Response) {
    const data = await smsService.updateSmsTemplate(req.params.id, req.body);
    res.json({ data: data });
  },

  async deleteSmsTemplate(req: Request, res: Response) {
    const data = await smsService.deleteSmsTemplate(req.params.id);
    res.json({ data: data });
  }
};
