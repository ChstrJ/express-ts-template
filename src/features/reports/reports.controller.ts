import { Request, Response } from 'express';
import { reportsService } from './reports.service';
import ExcelJS from 'exceljs';
import dayjs from 'dayjs';
import { fetchImageAsBuffer, getAccountName } from '../../common/utils/helpers';
import { salesService } from '../sales/sales.service';
import { formatMonth } from '@utils/date';
import { Role } from '@common/constants/roles';

export const reportsController = {
  async exportOrdersReport(req: Request, res: Response) {
    const fileName = `orders_report_${dayjs().format('YYYY-MM-DD_HH-mm-ss')}`;
    const workbook = new ExcelJS.Workbook();

    const sheet = workbook.addWorksheet('Orders Report');

    sheet.columns = [
      { header: 'Ordered By', key: 'ordered_by', width: 30 },
      { header: 'Contact Number', key: 'account_contact_number', width: 20 },
      { header: 'Payment Method', key: 'payment_method', width: 20 },
      { header: 'Total Amount', key: 'total_amount', width: 15 },
      { header: 'Order Status', key: 'order_status', width: 15 },
      { header: 'Payment Status', key: 'order_payment_status', width: 15 },
      { header: 'Payment Image', key: 'order_payment_image', width: 30 },
      { header: 'Date', key: 'created_at', width: 20 }
    ];

    sheet.getRow(1).font = { bold: true, size: 12 };
    sheet.getRow(1).alignment = { horizontal: 'left' };

    const { data } = await reportsService.getOrdersReport(req.query);

    for (const row of data) {
      sheet.addRow(row);
      if (row.order_payment_image) {
        try {
          const imageBuffer = await fetchImageAsBuffer(row.order_payment_image);
          const imageId = workbook.addImage({
            buffer: imageBuffer,
            extension: 'png' // Assuming png, you might need to determine this dynamically
          });

          const rowIndex = sheet.rowCount;
          sheet.addImage(imageId, {
            tl: { col: 7, row: rowIndex - 1 }, // top-left corner, 8th column
            br: { col: 8, row: rowIndex } // bottom-right corner
          });
          sheet.getRow(rowIndex).height = 100; // set row height to show the image
        } catch (error) {
          console.error(`Failed to fetch image from ${row.order_payment_image}`, error);
        }
      }
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}.xlsx`);

    await workbook.xlsx.write(res);

    res.end();
  },

  async exportUsersReport(req: Request, res: Response) {
    const fileName = `users_report_${dayjs().format('YYYY-MM-DD_HH-mm-ss')}`;
    const workbook = new ExcelJS.Workbook();

    const sheet = workbook.addWorksheet('Users Report');

    sheet.columns = [
      { header: 'Email', key: 'account_email', width: 30 },
      { header: 'First Name', key: 'account_first_name', width: 20 },
      { header: 'Last Name', key: 'account_last_name', width: 20 },
      { header: 'Contact Number', key: 'account_contact_number', width: 20 },
      { header: 'Status', key: 'account_status', width: 15 },
      { header: 'Image', key: 'account_image', width: 30 },
      { header: 'Product Package Name', key: 'product_package_name', width: 30 },
      { header: 'Product Package Price', key: 'product_package_price', width: 20 },
      { header: 'Rejection Reason', key: 'reason_message', width: 20 },
      { header: 'Date Joined', key: 'created_at', width: 20 }
    ];

    sheet.getRow(1).font = { bold: true, size: 12 };
    sheet.getRow(1).alignment = { horizontal: 'left' };

    const { data } = await reportsService.getUsersReport(req.query);

    sheet.addRows(data);

    // for (const row of data) {
    //     sheet.addRow(row);
    //     if (row.account_image) {
    //         try {
    //             const imageBuffer = await fetchImageAsBuffer(row.account_image);
    //             const imageId = workbook.addImage({
    //                 buffer: imageBuffer,
    //                 extension: 'png', // Assuming png, you might need to determine this dynamically
    //             });

    //             const rowIndex = sheet.rowCount;
    //             sheet.addImage(imageId, {
    //                 tl: { col: 7, row: rowIndex - 1 }, // top-left corner, 8th column
    //                 br: { col: 8, row: rowIndex }    // bottom-right corner
    //             });
    //             sheet.getRow(rowIndex).height = 100; // set row height to show the image
    //         } catch (error) {
    //             console.error(`Failed to fetch image from ${row.account_image}`, error);
    //         }
    //     }
    // }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}.xlsx`);

    await workbook.xlsx.write(res);

    res.end();
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
    const monthRange = formatMonth(req.query)

    // Define columns WITHOUT auto header
    productSheet.columns = [
      { header: 'Product name', key: 'product_name', width: 20 },
      { header: 'Total Sold', key: 'total_sold', width: 10 },
      { header: 'Total amount', key: 'total_amount', width: 15 },
    ];

    // Insert month row at row 1
    const monthRow = productSheet.insertRow(1, [`Product Sales for ${monthRange}`]);

    // Merge dynamically
    const totalCols = productSheet.columns.length;
    productSheet.mergeCells(1, 1, 1, totalCols);

    // Style
    monthRow.font = { bold: true, size: 13 };
    monthRow.alignment = { horizontal: 'center' };

    // Style the header row (row 2 now contains the column headers)
    productSheet.getRow(2).font = { bold: true, size: 12 };
    productSheet.getRow(2).alignment = { horizontal: 'left' };

    // Fetch and insert data
    const productData = await salesService.getOrderSalesReport(req.query);
    productSheet.addRows(productData);

    // Response setup
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  },

  async exportProductsReport(req: Request, res: Response) {
    const fileName = `products_${dayjs().format('YYYY-MM-DD_HH-mm-ss')}`;
    const workbook = new ExcelJS.Workbook();

    const productSheet = workbook.addWorksheet('Products');

    productSheet.columns = [
      { header: 'Business Package', key: 'product_package_name', width: 20 },
      { header: 'Name', key: 'product_name', width: 20 },
      { header: 'Description', key: 'product_description', width: 30 },
      { header: 'Price', key: 'product_price', width: 10 },
      { header: 'Stock', key: 'product_stock', width: 10 },
      { header: 'Category', key: 'product_category', width: 10 },
      { header: 'PV', key: 'product_pv', width: 10 },
      { header: 'Status', key: 'product_status', width: 10 },
      { header: 'Date Created', key: 'created_at', width: 15 },
      { header: 'Date Updated', key: 'updated_at', width: 15 }
    ];

    productSheet.getRow(1).font = { bold: true, size: 12 };
    productSheet.getRow(1).alignment = { horizontal: 'left' };

    const { data } = await reportsService.getProductsReport(req.query);

    productSheet.addRows(data);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}.xlsx`);

    await workbook.xlsx.write(res);

    res.end();
  },

  async exportLowStockProductsReport(req: Request, res: Response) {
    const fileName = `low_stock_products_${dayjs().format('YYYY-MM-DD_HH-mm-ss')}`;
    const workbook = new ExcelJS.Workbook();

    const productSheet = workbook.addWorksheet('Products');

    productSheet.columns = [
      { header: 'Business Package', key: 'product_package_name', width: 20 },
      { header: 'Name', key: 'product_name', width: 20 },
      { header: 'Description', key: 'product_description', width: 30 },
      { header: 'Price', key: 'product_price', width: 10 },
      { header: 'Stock', key: 'product_stock', width: 10 },
      { header: 'Category', key: 'product_category', width: 10 },
      { header: 'PV', key: 'product_pv', width: 10 },
      { header: 'Status', key: 'product_status', width: 10 },
      { header: 'Date Created', key: 'created_at', width: 15 },
      { header: 'Date Updated', key: 'updated_at', width: 15 }
    ];

    productSheet.getRow(1).font = { bold: true, size: 12 };
    productSheet.getRow(1).alignment = { horizontal: 'left' };

    const { data } = await reportsService.getLowStockProductsReport(req.query);

    productSheet.addRows(data);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}.xlsx`);

    await workbook.xlsx.write(res);

    res.end();
  },

  async exportCommissionsReport(req: Request, res: Response) {
    const fileName = `commissions_${dayjs().format('YYYY-MM-DD_HH-mm-ss')}`;
    const workbook = new ExcelJS.Workbook();

    const commissionSheet = workbook.addWorksheet('Commissions');

    commissionSheet.columns = [
      { header: 'Business Package', key: 'product_package_name', width: 20 },
      { header: 'Referrer', key: 'referrer_name', width: 15 },
      { header: 'Referee', key: 'referee_name', width: 15 },
      { header: 'Amount', key: 'commission_amount', width: 15 },
      { header: 'Type', key: 'commission_type', width: 15 },
      { header: 'Status', key: 'commission_status', width: 15 },
      { header: 'Date', key: 'created_at', width: 15 }
    ];

    commissionSheet.getRow(1).font = { bold: true, size: 12 };
    commissionSheet.getRow(1).alignment = { horizontal: 'left' };

    const { data } = await reportsService.getCommissionsReport(req.query);

    commissionSheet.addRows(data);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}.xlsx`);

    await workbook.xlsx.write(res);

    res.end();
  },

  async exportWithdrawalsReport(req: Request, res: Response) {
    const fileName = `withdrawals_${dayjs().format('YYYY-MM-DD_HH-mm-ss')}`;
    const workbook = new ExcelJS.Workbook();

    const withdrawalSheet = workbook.addWorksheet('Withdrawals');

    withdrawalSheet.columns = [
      { header: 'Reference No.', key: 'ref_no', width: 20 },
      { header: 'Name', key: 'name', width: 30 },
      { header: 'Email', key: 'account_email', width: 30 },
      { header: 'Contact No.', key: 'account_contact_number', width: 20 },
      { header: 'Payment Method', key: 'payment_method', width: 20 },
      { header: 'Payment Account Number', key: 'payment_method_number', width: 30 },
      { header: 'Amount', key: 'withdrawal_amount', width: 15 },
      { header: 'Status', key: 'withdrawal_status', width: 15 },
      { header: 'Date', key: 'created_at', width: 15 }
    ];

    withdrawalSheet.getRow(1).font = { bold: true, size: 12 };
    withdrawalSheet.getRow(1).alignment = { horizontal: 'left' };

    const { data } = await reportsService.getWithdrawalsReport(req.query);

    withdrawalSheet.addRows(data);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}.xlsx`);

    await workbook.xlsx.write(res);

    res.end();
  },

  async exportGenealogyReport(req: Request, res: Response) {
    const { accountId } = req.params;
    const fileName = `genealogy_${dayjs().format('YYYY-MM-DD_HH-mm-ss')}`;
    const workbook = new ExcelJS.Workbook();

    const genealogySheet = workbook.addWorksheet('Genealogy');
    const accountName = await getAccountName(accountId);

    genealogySheet.columns = [
      { header: 'Name', key: 'name', width: 20 },
      { header: 'Email', key: 'account_email', width: 20 },
      { header: 'Contact No.', key: 'account_contact_number', width: 15 },
      { header: 'Package', key: 'package_name', width: 10 },
      { header: 'Level', key: 'level', width: 10 },
      { header: 'Joined at', key: 'created_at', width: 10 },
    ];

    const headerRow = genealogySheet.insertRow(1, [`Genealogy for ${accountName}`]);

    const totalCols = genealogySheet.columns.length;
    genealogySheet.mergeCells(1, 1, 1, totalCols);

    headerRow.font = { bold: true, size: 13 };
    headerRow.alignment = { horizontal: 'center' };

    genealogySheet.getRow(2).font = { bold: true, size: 12 };
    genealogySheet.getRow(2).alignment = { horizontal: 'left' };

    const { data } = await reportsService.getGenealogy(accountId, req.query);

    genealogySheet.addRows(data);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}.xlsx`);

    await workbook.xlsx.write(res);

    res.end();
  },

  async exportUnreleasedCommissionReport(req: Request, res: Response) {
    const fileName = `unreleased_commission_${dayjs().format('YYYY-MM-DD_HH-mm-ss')}`;
    const workbook = new ExcelJS.Workbook();

    const sheet = workbook.addWorksheet('Genealogy');

    sheet.columns = [
      { header: 'Name', key: 'name', width: 20 },
      { header: 'Email', key: 'account_email', width: 20 },
      { header: 'Contact No.', key: 'account_contact_number', width: 15 },
      { header: 'Unreleased Commission', key: 'unreleased_commission', width: 15 },
    ];

    sheet.getRow(1).font = { bold: true, size: 12 };
    sheet.getRow(1).alignment = { horizontal: 'left' };

    const { data } = await reportsService.getUnreleasedCommissions(req.query);

    sheet.addRows(data);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}.xlsx`);

    await workbook.xlsx.write(res);

    res.end();
  },

  async exportInactiveMembers(req: Request, res: Response) {
    const fileName = `inactive_members_${dayjs().format('YYYY-MM-DD_HH-mm-ss')}`;
    const workbook = new ExcelJS.Workbook();

    const sheet = workbook.addWorksheet('Inactive Members');

    sheet.columns = [
      { header: 'Name', key: 'name', width: 20 },
      { header: 'Email', key: 'account_email', width: 20 },
      { header: 'Contact No.', key: 'account_contact_number', width: 15 },
    ];

    sheet.getRow(1).font = { bold: true, size: 12 };
    sheet.getRow(1).alignment = { horizontal: 'left' };

    const { data } = await reportsService.getInactiveMembers(req.query);

    sheet.addRows(data);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}.xlsx`);

    await workbook.xlsx.write(res);

    res.end();
  },

  async exportProductStockHistory(req: Request, res: Response) {
    const fileName = `inventory_${dayjs().format('YYYY-MM-DD_HH-mm-ss')}`;
    const workbook = new ExcelJS.Workbook();

    const { data } = await reportsService.getProductStockHistory(req.query);

    for (const datum of data) {
      let sheet: any = null;

      try {
        sheet = workbook.addWorksheet(datum.product_name.toUpperCase());
      } catch (e) {
        if (e.message.includes('already exists')) {
          sheet = workbook.getWorksheet(datum.product_name.toUpperCase())
        }
      }

      sheet.columns = [
        { header: 'Date', key: 'created_at', width: 20 },
        { header: 'Name', key: 'account_name', width: 25 },
        { header: 'Type', key: 'type', width: 10 },
        { header: 'Qty In', key: 'stock_in', width: 10 },
        { header: 'Qty Out', key: 'stock_out', width: 10 },
        { header: 'Running Balance', key: 'running_balance', width: 20 },
      ];

      sheet.getRow(1).font = { bold: true, size: 12 };
      sheet.getRow(1).alignment = { horizontal: 'left' };

      if (datum.account_role === Role.DISTRIBUTOR) {
        datum['account_name'] = `Distributor: ${datum['account_name']}`
      } else {
        datum['account_name'] = `Admin: ${datum['account_name']}`
      }

      datum['type'] = datum.type.split('_').join(' ').toUpperCase();

      sheet.addRow(datum);
    }


    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}.xlsx`);

    await workbook.xlsx.write(res);

    res.end();
  },

  async getReports(req: Request, res: Response) {
    const reports = reportsService.getReports();

    res.json({ data: reports });
  },

  async getInactiveMembers(req: Request, res: Response) {
    const { data, meta } = await reportsService.getInactiveMembers(req.query, true);

    res.json({ data: data, meta: meta });
  },

  async getCommissions(req: Request, res: Response) {
    const { data, meta } = await reportsService.getCommissionsReport(req.query, true);

    res.json({ data: data, meta: meta });
  },

  async getProductSales(req: Request, res: Response) {
    const { data, meta } = await reportsService.getProductsReport(req.query, true);

    res.json({ data: data, meta: meta });
  },

  async getLowStockProducts(req: Request, res: Response) {
    const { data, meta } = await reportsService.getLowStockProductsReport(req.query, true);

    res.json({ data: data, meta: meta });
  },

  async getGenealogy(req: Request, res: Response) {
    const { accountId } = req.params;
    const { data, meta } = await reportsService.getGenealogy(accountId, req.query, true);

    res.json({ data: data, meta: meta });
  },

  async getUsersReport(req: Request, res: Response) {
    const { data, meta } = await reportsService.getUsersReport(req.query, true);

    res.json({ data: data, meta: meta });
  },

  async getUnreleasedCommissions(req: Request, res: Response) {
    const { data, meta } = await reportsService.getUnreleasedCommissions(req.query, true);

    res.json({ data: data, meta: meta });
  },

  async getOrdersReport(req: Request, res: Response) {
    const { data, meta } = await reportsService.getOrdersReport(req.query, true);

    res.json({ data: data, meta: meta });
  },

  async getProductStockHistory(req: Request, res: Response) {
    const { data, meta } = await reportsService.getProductStockHistory(req.query, true);

    res.json({ data: data, meta: meta });
  },
};
