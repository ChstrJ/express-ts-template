import { Router } from 'express';
import { networkTreeController } from '@features/network-tree/network-tree.controller';

const router = Router();

router.get('/', networkTreeController.listNetwork);

export default router;
