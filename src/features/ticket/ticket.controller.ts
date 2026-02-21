import { Request, Response } from 'express';
import { ticketService } from './ticket.service';

export const ticketController = {
  async getTickets(req: Request, res: Response) {
    const { account_role, account_id } = req.user;
    const { data, meta } = await ticketService.getTickets({ accountId: account_id, q: req.query, role: account_role });

    res.json({ data: data, meta: meta });
  },

  async createTicket(req: Request, res: Response) {
    const { account_id } = req.user;

    const ticketData = req.body;
    const newTicket = await ticketService.createTicket(account_id, ticketData);
    res.status(201).json({ data: newTicket });
  }
}
