import { Router } from 'express';
import { emailController } from './email.controller';
import { validateRequest } from '@middlewares/validator';
import { emailSchema, updateEmailSchema } from '@common/schema/template';

const router = Router();

router.get('/templates', emailController.getEmails);
router.get('/vars', emailController.getEmailVars);
router.get('/types', emailController.getEmailTypes);
router.post('/template', validateRequest(emailSchema), emailController.createEmailTemplate);
router.patch('/template/:id', validateRequest(updateEmailSchema), emailController.updateEmailTemplate);
router.delete('/template/:id', emailController.deleteEmailTemplate);

export default router;
