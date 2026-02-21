import z from 'zod';

export const chatMessageSchema = z.object({
  sender_id: z.string().min(1).max(50),
  content: z.string().min(1).max(9999999999),
  is_deleted: z.number().min(0).max(1).default(0)
});

export const createChat = z.object({
  sender_id: z.string().min(1).max(50),
  recipient_id: z.string().min(1).max(50)
});

export const getOnlineAccountsSchema = z.object({
  account_name: z.string().optional()
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;
export type createChat = z.infer<typeof createChat>;
