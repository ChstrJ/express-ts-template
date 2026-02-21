import { Request, Response } from 'express';
import { salesService } from './sales.service';
import ExcelJS from 'exceljs';
import dayjs from 'dayjs';

export const salesController = {
  async getSalesStats(req: Request, res: Response) {
    const { grandTotalSales, packageSales, productSales, monthlyProductSales, monthlyPackageSales } = await salesService.totalSales();

    res.json({
      total_sales: grandTotalSales,
      package_sales: packageSales,
      product_sales: productSales,
      monthly_product_sales: monthlyProductSales,
      monthly_package_sales: monthlyPackageSales,
    });
  },

  async listSales(req: Request, res: Response) {
    const { results, meta } = await salesService.listSales(req.query);

    res.json({ data: results, meta: meta });
  },

  async exportPackageSales(req: Request, res: Response) {
    const fileName = `package_sales_${dayjs().format('YYYY-MM-DD_HH-mm-ss')}`;
    const workbook = new ExcelJS.Workbook();

    const packageSheet = workbook.addWorksheet('Package Sales');

    packageSheet.columns = [
      { header: 'Package name', key: 'package_name', width: 20 },
      { header: 'Quantity', key: 'quantity', width: 10 },
      { header: 'Price', key: 'price', width: 10 },
      { header: 'Total amount', key: 'total_amount', width: 15, outlineLevel: 1 },
      { header: 'Date', key: 'date', width: 15, outlineLevel: 1 }
    ];

    packageSheet.getRow(1).font = { bold: true, size: 12 };
    packageSheet.getRow(1).alignment = { horizontal: 'left' };

    const packageData = await salesService.getPackageSalesReport(req.query);

    packageSheet.addRows(packageData);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}.xlsx`);

    await workbook.xlsx.write(res);

    res.end();
  },

  async exportProductSales(req: Request, res: Response) {
    const fileName = `product_sales_${dayjs().format('YYYY-MM-DD_HH-mm-ss')}`;
    const workbook = new ExcelJS.Workbook();

    const productSheet = workbook.addWorksheet('Product Sales');

    productSheet.columns = [
      { header: 'Product name', key: 'product_name', width: 20 },
      { header: 'Quantity', key: 'quantity', width: 10 },
      { header: 'Price', key: 'price', width: 10 },
      { header: 'Total amount', key: 'total_amount', width: 15, outlineLevel: 1 },
      { header: 'Date', key: 'date', width: 15, outlineLevel: 1 }
    ];

    productSheet.getRow(1).font = { bold: true, size: 12 };
    productSheet.getRow(1).alignment = { horizontal: 'left' };

    const productData = await salesService.getOrderSalesReport(req.query);

    productSheet.addRows(productData);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}.xlsx`);

    await workbook.xlsx.write(res);

    res.end();
  },

  async listPackageSales(req: Request, res: Response) {
    const { data, meta } = await salesService.listPackageSales(req.query);

    res.json({ data: data, meta: meta });
  },

  async listProductSales(req: Request, res: Response) {
    const { data, meta } = await salesService.listProductSales(req.query);

    res.json({ data: data, meta: meta });
  }
};
