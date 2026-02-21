import z from 'zod';

export const rankSchema = z.object({
  name: z.enum(['bronze', 'silver', 'gold', 'platinum', 'diamond']),
  gv_req: z.number({ required_error: 'gv_req is required' }),
  pv_req: z.number({ required_error: 'pv_req is required' }),
  leg_cap: z.number().min(10).max(100).default(0),
  meta: z.object({
    max_levels: z.number().min(1).max(5),
    min_levels: z.number().min(1).max(5).default(1),
    group_bonus: z.number().default(0),
    company_bonus: z.number().default(0),
  }),
});

export const updateRank = rankSchema.partial();

export type CreateRankSetting = z.infer<typeof rankSchema>;
export type UpdateRankSetting = z.infer<typeof updateRank>;
