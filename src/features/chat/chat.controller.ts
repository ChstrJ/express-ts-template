import { Request, Response } from 'express';
import { chatService } from './chat.service';

export const chatController = {
  async getChats(req: Request, res: Response) {
    const { account_id } = req.user;
    const { data, meta } = await chatService.getChats({ accountId: account_id, q: req.query });
    res.json({ data: data, meta: meta });
  },

  async saveMessage(req: Request, res: Response) {
    const data = await chatService.saveMessage(req.params.id, req.body);

    res.json({ data: data });
  },

  async listMessages(req: Request, res: Response) {
    const { account_id } = req.user;
    const { data, meta } = await chatService.listMessages(req.params.id, account_id, req.query);

    res.json({ data: data, meta: meta });
  },

  async openChat(req: Request, res: Response) {
    const data = await chatService.createChatOrReturnChat(req.body);

    res.json({ channel: data });
  },

  async getOnlineAccounts(req: Request, res: Response) {
    const { account_id } = req.user;
    const { data, meta } = await chatService.getOnlineAccounts(account_id, req.query);

    res.json({ data: data, meta: meta });
  }
};
