import { Router } from 'express';
import { chatController } from './chat.controller';
import { validateRequest } from '@middlewares/validator';
import { chatMessageSchema, createChat } from '@common/schema/chat';

const router = Router();

router.get('/', chatController.getChats);
router.get('/online', chatController.getOnlineAccounts);
router.post('/open', validateRequest(createChat), chatController.openChat);
router.post('/:id/messages', validateRequest(chatMessageSchema), chatController.saveMessage);
router.get('/:id/messages', chatController.listMessages);

export default router;
