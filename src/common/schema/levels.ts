import { z } from 'zod';

export const levelSchema = z.object({
  level: z.number().positive().min(1).max(7),
  percentage: z.coerce.number().positive().min(1).max(50)
});

export const updateLevelSchema = levelSchema.partial();
