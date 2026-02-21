import { Request, Response } from 'express';
import { emailService } from './email.service';

export const emailController = {
  async getEmails(req: Request, res: Response) {
    const data = await emailService.getEmails();
    res.json({ data });
  },

  getEmailVars(req: Request, res: Response) {
    const data = emailService.getEmailVariables(req.query);
    res.json({ data });
  },

  getEmailTypes(req: Request, res: Response) {
    const data = emailService.getAllEmailTypes();
    res.json({ data });
  },

  async createEmailTemplate(req: Request, res: Response) {
    const data = await emailService.createEmailTemplate(req.body);

    res.json({ data });
  },

  async updateEmailTemplate(req: Request, res: Response) {
    const data = await emailService.updateEmailTemplate(req.params.id, req.body);

    res.json({ data });
  },

  async deleteEmailTemplate(req: Request, res: Response) {
    const data = await emailService.deleteEmailTemplate(req.params.id);

    res.json({ data });
  }
};