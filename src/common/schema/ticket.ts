import z from 'zod';

export const ticketSchema = z.object({
  subject: z.string().min(1).max(100),
  description: z.string().min(1).max(1000),
  status: z.enum(['open', 'in_progress', 'resolved', 'closed']).default('open')
});

export const csrIdSchema = z.object({
  csr_id: z.string().uuid()
});

export const ticketStatus = z.object({
  status: z.enum(['resolved', 'in_progress', 'open']).default('open')
});

export const updateTicketSchema = ticketSchema.partial();

export type CreateTicket = z.infer<typeof ticketSchema>;
export type UpdateTicket = z.infer<typeof updateTicketSchema>;
