import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().nonempty('Email cannot be empty').email('Invalid email address'),
  password: z.string()
});

export const registerSchema = z
  .object({
    email: z.string({ required_error: 'Email field is required.' }).email('Invalid email address'),
    password: z.string({ required_error: 'Password field is required.' }).min(6, 'Password should be atleast 6 characters'),
    confirm_password: z.string({ required_error: 'Confirm password field is required.' }).min(6, 'Password should be atleast 6 characters'),
    first_name: z.string({ required_error: 'First name field is required.' }).min(1, 'First name cannot be empty'),
    last_name: z.string({ required_error: 'Last name field is required.' }).min(1, 'Last name cannot be empty'),
    contact_number: z.string({ required_error: 'Contact number field is required.' }).max(11, 'Exceeded maximum characters').startsWith('09', 'It should starts with 09'),
    package_id: z.string({ required_error: 'Package ID is required.' }).nonempty().optional().nullable(),
    referral_code: z.string({ required_error: 'Referral Code is required.' }).nonempty().optional().nullable(),
    role: z.enum(['distributor']).default('distributor')
  })
  .refine((data) => data.password === data.confirm_password, {
    message: 'Password does not match.',
    path: ['confirm_password']
  });
