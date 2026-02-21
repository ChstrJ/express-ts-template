import { Router } from 'express';
import { validateRequest } from '@middlewares/validator';
import { walletAmount } from '@common/schema/wallet';
import { walletController } from './wallet.controller';

const router = Router();

router.get('/all', walletController.listWallets);
router.get('/', walletController.getWallet);
router.get('/transaction-history', walletController.listTransactionHistory);
router.post('/cashout', validateRequest(walletAmount), walletController.requestCashout);

export default router;
