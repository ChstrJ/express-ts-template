import { z } from 'zod';

// const basicPermissionSchema = z.object({
//     read: z.number({ required_error: 'Read permission is required.'}).int().min(0).max(1),
//     create: z.number({ required_error: 'Create permission is required.'}).int().min(0).max(1),
//     update: z.number({ required_error: 'Update permission is required.'}).int().min(0).max(1),
//     delete: z.number({ required_error: 'Delete permission is required.'}).int().min(0).max(1),
// });

// const exportablePermissionSchema = basicPermissionSchema.extend({
//     export: z.number().int().min(0).max(1),
// });

const basicPermissionSchema = z.object({
  access: z.number().min(0).max(1).default(0)
});

export const adminPermissionSchema = z.object({
  sales: basicPermissionSchema.optional().default({ access: 0 }),
  orders: basicPermissionSchema.optional().default({ access: 0 }),
  products: basicPermissionSchema.optional().default({ access: 0 }),
  packages: basicPermissionSchema.optional().default({ access: 0 }),
  levels: basicPermissionSchema.optional().default({ access: 0 }),
  recruitment: basicPermissionSchema.optional().default({ access: 0 }),
  leaderboard: basicPermissionSchema.optional().default({ access: 0 }),
  genealogy: basicPermissionSchema.optional().default({ access: 0 }),
  admin_panel: basicPermissionSchema.optional().default({ access: 0 }),
  wallet: basicPermissionSchema.optional().default({ access: 0 }),
  mlm_calculator: basicPermissionSchema.optional().default({ access: 0 }),
  user_management: basicPermissionSchema.optional().default({ access: 0 }),
  settings: basicPermissionSchema.optional().default({ access: 0 }),
  store: basicPermissionSchema.optional().default({ access: 0 }),
  pending_user: basicPermissionSchema.optional().default({ access: 0 }),
  chat: basicPermissionSchema.optional().default({ access: 0 }),
  chat_support: basicPermissionSchema.optional().default({ access: 0 }),
  reports: basicPermissionSchema.optional().default({ access: 0 }),
  rankings: basicPermissionSchema.optional().default({ access: 0 }),
  all_teams: basicPermissionSchema.optional().default({ access: 0 }),
  delete_data: basicPermissionSchema.optional().default({ access: 0 }),
  activity_log: basicPermissionSchema.optional().default({ access: 0 })
});

export const adminSchema = z.object({
  email: z.string({ required_error: 'Email field is required.' }).email('Invalid email address'),
  password: z.string({ required_error: 'Password field is required.' }).min(6, 'Password should be atleast 6 characters'),
  confirm_password: z.string({ required_error: 'Confirm password field is required.' }).min(6, 'Password should be atleast 6 characters'),
  first_name: z.string({ required_error: 'First name field is required.' }).min(1, 'First name cannot be empty'),
  last_name: z.string({ required_error: 'Last name field is required.' }).min(1, 'Last name cannot be empty'),
  contact_number: z.string({ required_error: 'Contact number field is required.' }).min(11, 'Invalid phone number.').startsWith('09', 'It should starts with 09'),
  role: z.enum(['admin', 'csr', 'warehouse', 'finance']).default('admin')
});

export const createAdminSchema = adminSchema.extend({
  permissions: adminPermissionSchema
});

export const updateAdminSchema = adminSchema.partial().extend({
  permissions: adminPermissionSchema
});
