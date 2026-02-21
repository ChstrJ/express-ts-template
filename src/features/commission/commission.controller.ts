import { Request, Response } from 'express';
import { commissionService } from './commission.service';

export const commissionController = {
  async listCommissions(req: Request, res: Response) {
    const data = await commissionService.listAllCommission(req.query);

    res.json({ data: data });
  },

  async listCommissionsByDistributor(req: Request, res: Response) {
    const { data, meta } = await commissionService.listAccountCommission(req.params.accountId, req.query);

    res.json({ data: data, meta: meta });
  },

  async totalCommissions(req: Request, res: Response) {
    const { account_id } = req.user;
    const {
      grandTotalCommission,
      sumPackageCommission,
      sumProductCommission,
      sumLastMonthPackageCommission,
      sumLastMonthProductCommission,
      sumMonthlyPackageCommission,
      sumMonthlyProductCommission
    } = await commissionService.sumAllCommission(account_id);

    res.json({
      data: {
        grand_total_commission: grandTotalCommission,
        total_package_commission: sumPackageCommission,
        total_product_commission: sumProductCommission,
        last_month_package_commission: sumLastMonthPackageCommission,
        last_month_product_commission: sumLastMonthProductCommission,
        monthly_package_commission: sumMonthlyPackageCommission,
        monthly_product_commission: sumMonthlyProductCommission
      }
    });
  }
};
