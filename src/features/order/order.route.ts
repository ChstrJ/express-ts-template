import { Router } from 'express';
import { validateRequest } from '@middlewares/validator';
import { orderItemSchema, updateQuantity } from '@common/schema/orders';
import { orderController } from './order.controller';

const router = Router();

router.get('/export', orderController.exportOrders);
router.get('/distributor/:accountId', orderController.listDistributorOrders);

router.post('/', validateRequest(orderItemSchema), orderController.createOrder);
router.get('/', orderController.listOrders);
router.get('/:orderId/items', orderController.listOrderItems);
router.patch('/items/:itemId', validateRequest(updateQuantity), orderController.updateQuantity);
router.delete('/:orderId', orderController.deleteOrder);

export default router;
