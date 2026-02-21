import z from "zod";

export const times = z.object({
  times: z.string().min(1).max(999)
});

export const minWithdrawAmount = z.object({
  amount: z.coerce.number().min(1).max(999999)
});

export const pv = z.object({
  pv: z.coerce.string().min(1).max(999999)
});

export const threshold = z.object({
  threshold: z.coerce.string().min(1).max(999999)
});