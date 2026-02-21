import { Router } from 'express';
import { referralCodeController } from '@features/referral-code/referral-code.controller';
import { validateRequest } from '@middlewares/validator';
import { urlSchema } from '@common/schema/referral';

const router = Router();

router.get('/generate', validateRequest(urlSchema), referralCodeController.generateReferralCodeLink);

export default router;
