import { EmailType } from '@common/constants/email';
import {
  sendActivatedAccountEmail,
  sendOrderPaymentEmail,
  sendOrderPlacedEmail,
  sendOrderUpdateEmail,
  sendPendingEmail,
  sendRejectedEmail,
  sendReplyToNewApplicantsEmail,
  sendThankyouEmail,
  sendUsedReferralEmail,
  sendWelcomeWithAttachmentEmail,
  sendOrderRejectedEmail,
  sendOrderReadyForPickupEmail,
  sendOrderPickupConfirmedEmail,
  sendOnHoldCommissionEmail
} from '@lib/email';
import { BaseJob } from './base';
import { defaultQueue } from 'src/queues/default';
import { Job } from '@common/constants/job';

export class EmailJob extends BaseJob {
  protected static jobName: string = Job.EMAIL;
  protected static queue = defaultQueue;
  protected static attempts: number = 1;

  static async handle(job: any) {
    switch (job.type) {
      case EmailType.WELCOME_EMAIL:
        return await sendWelcomeWithAttachmentEmail(job.payload);
      case EmailType.PENDING_EMAIL:
        return await sendPendingEmail(job.payload);
      case EmailType.REJECTED_EMAIL:
        return await sendRejectedEmail(job.payload);
      case EmailType.THANK_YOU_EMAIL:
        return await sendThankyouEmail(job.payload);
      case EmailType.ACTIVATED_ACCOUNT_EMAIL:
        return await sendActivatedAccountEmail(job.payload);
      case EmailType.USED_REFERRAL_EMAIL:
        return await sendUsedReferralEmail(job.payload);
      case EmailType.ORDER_STATUS_UPDATE_EMAIL:
        return await sendOrderUpdateEmail(job.payload);
      case EmailType.ORDER_PLACED_EMAIL:
        return await sendOrderPlacedEmail(job.payload);
      case EmailType.ORDER_PAYMENT_EMAIL:
        return await sendOrderPaymentEmail(job.payload);
      case EmailType.ORDER_READY_FOR_PICKUP_EMAIL:
        return await sendOrderReadyForPickupEmail(job.payload);
      case EmailType.ORDER_PICKUP_CONFIRMED_EMAIL:
        return await sendOrderPickupConfirmedEmail(job.payload);
      case EmailType.REPLY_TO_NEW_APPLICANTS_EMAIL:
        return await sendReplyToNewApplicantsEmail(job.payload);
      case EmailType.ORDER_REJECTED_EMAIL:
        return await sendOrderRejectedEmail(job.payload);
      case EmailType.ON_HOLD_COMMISSION_EMAIL:
        return await sendOnHoldCommissionEmail(job.payload);
      default:
        return;
    }
  }
}
