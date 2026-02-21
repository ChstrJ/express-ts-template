import z from 'zod';
import { imageSchema } from './multipart';

export const paymentMethod = z.object({
  method: z.string().min(1).max(50),
  name: z.string().min(1).max(50),
  number: z.string().min(1).max(100000),
  type: z.enum(['e-wallet', 'cash', 'card', 'bank', 'others']),
  status: z.string().default('active').optional()
});

export const orderPayment = z.object({
  //order_id: z.string().min(1).max(50),
  method_id: z.string().min(1).max(50)
  //status: z.enum(['pending', 'verified', 'sent']).default('pending').optional(),
});

export const orderPaymentStatus = z.object({
  status: z.enum(['pending', 'verified', 'sent']).default('pending')
});

export const paymentMethodSchema = paymentMethod.merge(imageSchema);
export const orderPaymentSchema = orderPayment.merge(imageSchema);

export const updatePaymentMethodSchema = paymentMethod.partial();
export const updateOrderPaymentSchema = orderPayment.partial();

export type createPaymentMethodType = z.infer<typeof paymentMethodSchema>;
export type updatePaymentMethodType = Partial<createPaymentMethodType>;
export type createOrderPayment = z.infer<typeof orderPaymentSchema>;
export type updateOrderPayment = Partial<createOrderPayment>;
