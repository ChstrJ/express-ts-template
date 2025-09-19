import { Router } from 'express';
import { accountController } from './account.controller';
const router = Router();

router.get('/', accountController.findAll)

export default router;
