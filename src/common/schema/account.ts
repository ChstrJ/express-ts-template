import { z } from 'zod';
import { imageSchema } from './multipart';

export const accountStatus = z
  .object({
    status: z.enum(['approved', 'rejected', 'inactive', 'active']),
    reason: z.string().optional()
  })
  .refine(
    (data) => {
      if (data.status === 'rejected' && !data.reason) {
        return false;
      }
      return true;
    },
    {
      message: 'Reason is required.',
      path: ['reason']
    }
  );

export const baseAccount = z.object({
  email: z.string({ required_error: 'Email field is required.' }).email('Invalid email address'),
  first_name: z.string({ required_error: 'First name field is required.' }).min(1, 'First name cannot be empty'),
  last_name: z.string({ required_error: 'Last name field is required.' }).min(1, 'Last name cannot be empty'),
  password: z.string({ required_error: 'Password is required.' }).min(1, 'Password cannot be empty'),
  status: z.enum(['inactive', 'active']).optional(),
  contact_number: z.string({ required_error: 'Contact number field is required.' }).min(11, 'Invalid phone number.').startsWith('09', 'It should starts with 09')
});

export const accountPaymentMethod = z.object({
  method: z.string().min(1).max(50),
  name: z.string().min(1).max(50),
  number: z.string().min(1).max(99999999999999),
  status: z.string().default('active').optional()
});

export const accountPaymentMethodSchema = accountPaymentMethod.merge(imageSchema);
export const accountUpdatePaymentMethodSchema = accountPaymentMethod.partial();

export const baseAccountWithImage = baseAccount.merge(imageSchema);

export const updateAccountSchema = baseAccountWithImage.partial();

export const resetPassword = z.object({
  old_password: z.string({ required_error: 'Old password is required.' }),
  new_password: z.string({ required_error: 'New password is required.' }),
  confirm_password: z.string({ required_error: 'Confirm Password is required.' })
})

export type updateAccount = z.infer<typeof updateAccountSchema>;
export type createAccount = z.infer<typeof baseAccountWithImage>;
export type createPaymentMethod = z.infer<typeof accountPaymentMethodSchema>;
export type updatePaymentMethod = Partial<createPaymentMethod>;
