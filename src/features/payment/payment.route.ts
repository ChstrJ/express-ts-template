import { Router } from 'express';
import { paymentController } from './payment.controller';
import { validateRequest } from '@middlewares/validator';
import { orderPaymentSchema, paymentMethodSchema, updatePaymentMethodSchema } from '@common/schema/payment';
import multer from 'multer';
import { processImage } from '@middlewares/image-processor';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/methods', paymentController.getAllPaymentMethods);
router.get('/methods/:id', paymentController.getPaymentMethod);
router.delete('/methods/:id', paymentController.deletePaymentMethod);
router.patch('/methods/:id', upload.single('image'), processImage('image'), validateRequest(updatePaymentMethodSchema), paymentController.updatePaymentMethod);
router.post('/methods', upload.single('image'), processImage('image'), validateRequest(paymentMethodSchema), paymentController.createPaymentMethod);

router.post('/:orderId', upload.single('image'), processImage('image'), validateRequest(orderPaymentSchema), paymentController.sendPayment);
router.get('/', paymentController.getAllPayments);
router.get('/:orderId', paymentController.getPayment);

export default router;
