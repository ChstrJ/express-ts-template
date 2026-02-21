import { Router } from 'express';
import { smsController } from './sms.controller';
import { validateRequest } from '@middlewares/validator';
import { smsSchema, updateSmsSchema } from '@common/schema/template';

const router = Router();

router.get('/templates', smsController.getSmsTemplate);
router.get('/vars', smsController.getSmsVars);
router.get('/types', smsController.getSmsTypes);
router.post('/template', validateRequest(smsSchema), smsController.createSmsTemplate);
router.patch('/template/:id', validateRequest(updateSmsSchema), smsController.updateSmsTemplate);
router.delete('/template/:id', smsController.deleteSmsTemplate);

export default router;
