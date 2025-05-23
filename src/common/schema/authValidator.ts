import { z } from 'zod';

export const loginValidator = z.object({
  email: z.string().nonempty('Email cannot be empty').email('Invalid email address'),
  password: z.string().min(6, 'Password should be atleast 6 characters'),
});

export const registerValidator = z
  .object({
    email: z.string({ required_error: 'Email field is required.' }).email('Invalid email address'),
    password: z
      .string({ required_error: 'Password field is required.' })
      .min(6, 'Password should be atleast 6 characters'),
    confirm_password: z
      .string({ required_error: 'Confirm password field is required.' })
      .min(6, 'Password should be atleast 6 characters'),
    first_name: z
      .string({ required_error: 'First name field is required.' })
      .min(1, 'First name cannot be empty'),
    last_name: z
      .string({ required_error: 'Last name field is required.' })
      .min(1, 'Last name cannot be empty'),
    contact_number: z
      .string({ required_error: 'Contact number field is required.' })
      .min(11, 'Invalid phone number.')
      .startsWith('09', 'It should starts with 09'),
    type: z
      .enum([
        'employee_manager',
        'employee_staff',
        'employee_sales',
        'employee_accountant',
        'super_admin',
        'admin',
      ])
      .optional()
      .nullable(),
    branch_id: z.string({ required_error: 'Branch field is required.' }).optional(),
    department_id: z.string({ required_error: 'Department field is required.' }).optional(),
  })
  .refine(data => data.password === data.confirm_password, {
    message: 'Password does not match.',
    path: ['confirm_password'],
  });
