import { Status } from '@common/constants/status';
import z from 'zod';

export const walletAmount = z.object({
  amount: z.coerce.number().min(1).max(999999)
});

export const minWithdrawAmount = z.object({
  amount: z.coerce.number().min(1).max(999999)
});

export const withdrawStatus = z
  .object({
    status: z.enum(['pending', 'processing', 'completed', 'rejected']).default('pending'),
    ref_no: z.string().optional()
  })
  .refine(
    (data) => {
      if (data.status === Status.COMPLETED && !data.ref_no) {
        return false;
      }

      return true;
    },
    {
      message: 'Reference number is required.',
      path: ['ref_no']
    }
  );
