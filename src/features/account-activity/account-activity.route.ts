import { Router } from 'express';
import { accountActivityController } from './account-activity.controller';

const router = Router();

router.get('/', accountActivityController.getAccountActivities);

export default router;
