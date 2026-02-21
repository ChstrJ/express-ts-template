import { Request, Response } from 'express';
import { referralCodeService } from '@features/referral-code/referral-code.service';

export const referralCodeController = {
  async generateReferralCodeLink(req: Request, res: Response) {
    const link = await referralCodeService.generateReferralCodeLink(req);

    res.json({
      data: {
        url: link
      }
    });
  }
};
