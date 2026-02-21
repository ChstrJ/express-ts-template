import { StatusCodes } from 'http-status-codes';
import { orderService } from './order.service';
import { Request, Response } from 'express';
import ExcelJS from 'exceljs';

export const orderController = {
  async exportOrders(req: Request, res: Response) {
    const workbook = new ExcelJS.Workbook();

    const sheet = workbook.addWorksheet('Orders');

    sheet.columns = [
      { header: 'Id', key: 'id', width: 10 },
      { header: 'Name', key: 'name', width: 32 },
      { header: 'D.O.B.', key: 'DOB', width: 10, outlineLevel: 1 }
    ];

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=orders.xlsx');

    await workbook.xlsx.write(res);

    res.end();
  },

  async createOrder(req: Request, res: Response) {
    const { account_id } = req.user;

    const data = await orderService.createOrder(req.body, account_id);

    res.status(StatusCodes.CREATED).json({ data: data });
  },

  async deleteOrder(req: Request, res: Response) {
    const { orderId } = req.params;

    const data = await orderService.deleteOrder(orderId);

    res.json({ data: data });
  },

  async listOrders(req: Request, res: Response) {
    const { data, meta } = await orderService.listOrders(req.query);

    res.json({ data: data, meta: meta });
  },

  async listDistributorOrders(req: Request, res: Response) {
    const { accountId } = req.params;

    const { data, meta } = await orderService.listDistributorOrders(accountId, req.query);

    res.json({ data: data, meta: meta });
  },

  async listOrderItems(req: Request, res: Response) {
    const { orderId } = req.params;

    const data = await orderService.listOrderItems(orderId);

    res.json({ data: data });
  },

  async updateQuantity(req: Request, res: Response) {
    const { itemId } = req.params;

    const data = await orderService.updateQuantity(itemId, req.body);

    res.json({ data: data });
  }
};
