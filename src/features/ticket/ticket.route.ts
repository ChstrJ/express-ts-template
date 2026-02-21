import { Router } from 'express';
import { validateRequest } from '@middlewares/validator';
import { ticketSchema } from '@common/schema/ticket';
import { ticketController } from './ticket.controller';

const router = Router();

router.get('/', ticketController.getTickets);
router.post('/', validateRequest(ticketSchema), ticketController.createTicket);

export default router;
