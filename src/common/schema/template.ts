import z from 'zod';
import { EmailType } from '@common/constants/email';
import { SMS } from '@common/constants/sms';

export const smsSchema = z.object({
  name: z.string().min(2).max(100),
  type: z.enum([SMS.TYPE_ORDER_APPROVED]),
  content: z.string().min(2).max(9999)
});

export const emailSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum([
    EmailType.WELCOME_EMAIL,
    EmailType.PENDING_EMAIL,
    EmailType.REJECTED_EMAIL,
    EmailType.USED_REFERRAL_EMAIL,
    EmailType.ORDER_PAYMENT_EMAIL,
    EmailType.ORDER_PLACED_EMAIL,
    EmailType.ORDER_REJECTED_EMAIL,
    EmailType.REPLY_TO_NEW_APPLICANTS_EMAIL,
    EmailType.ORDER_READY_FOR_PICKUP_EMAIL,
    EmailType.ORDER_PICKUP_CONFIRMED_EMAIL,
    EmailType.ON_HOLD_COMMISSION_EMAIL,
    //EmailType.ORDER_STATUS_UPDATE_EMAIL,
    //EmailType.THANK_YOU_EMAIL,
    //EmailType.ACTIVATED_ACCOUNT
  ]),
  content: z.string().min(1).max(99999)
});

export const updateSmsSchema = smsSchema.partial();
export const updateEmailSchema = emailSchema.partial();

export type SmsTemplate = z.infer<typeof smsSchema>;
export type UpdateSmsTemplate = z.infer<typeof updateSmsSchema>;
export type EmailTemplate = z.infer<typeof emailSchema>;
export type UpdateEmailTemplate = z.infer<typeof updateEmailSchema>;
