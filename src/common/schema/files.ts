import z from "zod";
import { fileSchema } from "./multipart";
import { Email, EmailType } from "@common/constants/email";

export const baseFileSchema = z.object({
    file_doc_type: z.enum([
        EmailType.WELCOME_EMAIL,
        EmailType.PENDING_EMAIL,
        EmailType.REJECTED_EMAIL,
        EmailType.USED_REFERRAL_EMAIL,
        EmailType.ORDER_PAYMENT_EMAIL,
        EmailType.ORDER_PLACED_EMAIL,
        EmailType.ORDER_REJECTED_EMAIL,
        EmailType.REPLY_TO_NEW_APPLICANTS_EMAIL,
        EmailType.ORDER_PICKUP_CONFIRMED_EMAIL,
        EmailType.ORDER_READY_FOR_PICKUP_EMAIL,
        EmailType.UNRELEASED_COMMISSION_EMAIL,
    ], { required_error: 'file_doc_type is required.' })
});

export const filesSchema = baseFileSchema.merge(fileSchema);

export type CreateFile = z.infer<typeof filesSchema>;

export type UpdateFile = Partial<CreateFile>;
