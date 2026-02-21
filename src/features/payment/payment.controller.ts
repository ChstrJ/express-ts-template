import { Request, Response } from 'express';
import { paymentService } from './payment.service';

export const paymentController = {
  async createPaymentMethod(req: Request, res: Response) {
    const file = req.file as Express.Multer.File;
    const data = req.body;
    const { account_id: adminId } = req.user;

    await paymentService.createPaymentMethod(adminId, data, file);

    res.status(201).json({ message: 'Payment method created successfully' });
  },

  async getAllPaymentMethods(req: Request, res: Response) {
    const data = await paymentService.getAllPaymentMethods();

    res.json({ data: data });
  },

  async getAllPayments(req: Request, res: Response) {
    const data = await paymentService.getAllOrderPayment();

    res.json({ data: data });
  },

  async getPaymentMethod(req: Request, res: Response) {
    const { id } = req.params;

    const data = await paymentService.findPaymentMethod(id);

    res.json({ data: data });
  },

  async updatePaymentMethod(req: Request, res: Response) {
    const { id } = req.params;
    const { account_id: adminId } = req.user;
    const data = req.body;
    const file = req.file as Express.Multer.File;

    await paymentService.updatePaymentMethod(adminId, id, data, file);

    res.json({ message: 'Payment method updated successfully' });
  },

  async deletePaymentMethod(req: Request, res: Response) {
    const { id } = req.params;
    const { account_id: adminId } = req.user;

    await paymentService.deletePaymentMethod(adminId, id);

    res.json({ message: 'Payment method deleted successfully' });
  },

  async sendPayment(req: Request, res: Response) {
    const { orderId } = req.params;
    const data = req.body;
    const file = req.file as Express.Multer.File;

    await paymentService.sendPayment(orderId, data, file);

    res.json({ message: 'Payment sent successfully' });
  },

  async getPayment(req: Request, res: Response) {
    const { orderId } = req.params;

    const data = await paymentService.getPayment(orderId);

    res.json({ data: data });
  }
};
