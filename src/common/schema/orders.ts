import { z } from 'zod';

export const orderItem = z.object({
  product_id: z.string({ required_error: 'Product ID is required.' }),
  quantity: z.coerce.number({ required_error: 'Quantity is required.' }).positive().min(1).max(999),
  price: z.coerce.number({ required_error: 'Price is required.' }).positive().min(1)
});

export const orderStatus = z.object({
  status: z.enum(['approved', 'ready', 'completed', 'rejected', 'accepted', 'waiting', 'preparing'])
});

export const updateQuantity = z.object({
  increase: z.number().min(1).max(10).optional(),
  decrease: z.number().min(1).max(10).optional()
});

export const orderItemSchema = z.array(orderItem).min(1);

export type UpdateQuantity = Partial<z.infer<typeof updateQuantity>>;

export type OrderItem = z.infer<typeof orderItem>;
export type OrderItems = z.infer<typeof orderItemSchema>;
