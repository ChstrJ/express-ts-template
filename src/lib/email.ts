import { EmailSubject, EmailType } from '@common/constants/email';
import { compileEmailTemplate } from './handlerbars';
import { sendEmail } from './resend';
import dotenv from 'dotenv';
import db from 'src/db/db-client';
import logger from '@utils/logger';
import { getCurrentFormattedDate } from '@utils/date';
import { Status } from '@common/constants/status';
import { adminService } from '@features/admin/admin.service';
import _ from 'lodash';
dotenv.config();

const URL = process.env.APP_URL ?? '';

export const sendWelcomeEmail = async (payload: any) => {
  const data = await getEmailTemplateFromDB(EmailType.WELCOME_EMAIL);

  if (!data) {
    logger.error(`No email template found for '${EmailType.WELCOME_EMAIL}'`);
    return;
  }

  const template = data?.html_content ?? '';
  const subject = data?.email_template_name ?? EmailSubject.WELCOME_EMAIL;

  const html = compileEmailTemplate(template, {
    account_name: payload.account_name,
    package_name: payload.package_name,
    amount: payload.amount,
    date: getCurrentFormattedDate(),
    status: Status.ACTIVE,
  });

  await sendEmail(payload.to, subject, html);
};

export const sendWelcomeWithAttachmentEmail = async (payload: any) => {
  const data = await getEmailTemplateFromDB(EmailType.WELCOME_EMAIL);

  if (!data) {
    logger.error(`No email template found for '${EmailType.WELCOME_EMAIL}'`);
    return;
  }

  const template = data?.html_content ?? '';
  const subject = data?.email_template_name ?? EmailSubject.WELCOME_EMAIL;

  const html = compileEmailTemplate(template, {
    account_name: payload.account_name,
    package_name: payload.package_name,
    amount: payload.amount,
    date: getCurrentFormattedDate(),
    status: Status.ACTIVE,
  });

  const attachments = await adminService.formatAttachment(EmailType.WELCOME_EMAIL);

  if (!_.isEmpty(attachments)) {
    await sendEmail(payload.to, subject, html, attachments);
  } else {
    await sendEmail(payload.to, subject, html);
  }
};

export const sendActivatedAccountEmail = async (payload: any) => {
  const data = await getEmailTemplateFromDB(EmailType.ACTIVATED_ACCOUNT_EMAIL);

  if (!data) {
    logger.error(`No email template found for '${EmailType.ACTIVATED_ACCOUNT_EMAIL}'`);
    return;
  }

  const template = data?.html_content ?? '';
  const subject = data?.email_template_name ?? EmailSubject.ACTIVATED_ACCOUNT_EMAIL;

  const html = compileEmailTemplate(template, {
    account_name: payload.account_name,
    package_name: payload.package_name,
    link: URL + payload.dashboard_link,
    year: new Date().getFullYear()
  });

  await sendEmail(payload.to, subject, html);
};

export const sendUsedReferralEmail = async (payload: any) => {
  const data = await getEmailTemplateFromDB(EmailType.USED_REFERRAL_EMAIL);

  if (!data) {
    logger.error(`No email template found for '${EmailType.USED_REFERRAL_EMAIL}'`);
    return;
  }

  const template = data?.html_content ?? '';
  const subject = data?.email_template_name ?? EmailSubject.USED_REFERRAL_EMAIL;

  const html = compileEmailTemplate(template, {
    account_name: payload.account_name,
    referred_name: payload.referred_name,
    referral_code: payload.referral_code,
    year: new Date().getFullYear()
  });

  const attachments = await adminService.formatAttachment(EmailType.USED_REFERRAL_EMAIL);

  if (!_.isEmpty(attachments)) {
    await sendEmail(payload.to, subject, html, attachments);
  } else {
    await sendEmail(payload.to, subject, html);
  }
};

export const sendOrderUpdateEmail = async (payload: any) => {
  const data = await getEmailTemplateFromDB(EmailType.ORDER_STATUS_UPDATE_EMAIL);

  if (!data) {
    logger.error(`No email template found for '${EmailType.ORDER_STATUS_UPDATE_EMAIL}'`);
    return;
  }

  const template = data?.html_content ?? '';
  const subject = data?.email_template_name ?? EmailSubject.ORDER_STATUS_UPDATE_EMAIL;

  const html = compileEmailTemplate(template, {
    account_name: payload.account_name,
    order_status: payload.status,
    link: URL + payload.order_link,
    date: payload.date,
    year: new Date().getFullYear()
  });

  await sendEmail(payload.to, subject, html);
};


export const sendRejectedEmail = async (payload: any) => {
  const data = await getEmailTemplateFromDB(EmailType.REJECTED_EMAIL);

  if (!data) {
    logger.error(`No email template found for '${EmailType.REJECTED_EMAIL}'`);
    return;
  }

  const template = data?.html_content ?? '';
  const subject = data?.email_template_name ?? EmailSubject.REJECTED_EMAIL;

  const html = compileEmailTemplate(template, {
    account_name: payload.account_name,
    package_name: payload.package_name,
  });

  const attachments = await adminService.formatAttachment(EmailType.REJECTED_EMAIL);

  if (!_.isEmpty(attachments)) {
    await sendEmail(payload.to, subject, html, attachments);
  } else {
    await sendEmail(payload.to, subject, html);
  }
};


export const sendPendingEmail = async (payload: any) => {
  const data = await getEmailTemplateFromDB(EmailType.PENDING_EMAIL);

  if (!data) {
    logger.error(`No email template found for '${EmailType.PENDING_EMAIL}'`);
    return;
  }

  const template = data?.html_content ?? '';
  const subject = data?.email_template_name ?? EmailSubject.PENDING_EMAIL;

  const html = compileEmailTemplate(template, {
    account_name: payload.account_name,
    package_name: payload.package_name,
    amount: payload.amount,
    status: Status.PENDING,
    date: getCurrentFormattedDate()
  });

  const attachments = await adminService.formatAttachment(EmailType.PENDING_EMAIL);

  if (!_.isEmpty(attachments)) {
    await sendEmail(payload.to, subject, html, attachments);
  } else {
    await sendEmail(payload.to, subject, html);
  }
};

export const sendOrderPlacedEmail = async (payload: any) => {
  const data = await getEmailTemplateFromDB(EmailType.ORDER_PLACED_EMAIL);

  if (!data) {
    logger.error(`No email template found for '${EmailType.ORDER_PLACED_EMAIL}'`);
    return;
  }

  const template = data?.html_content ?? '';
  const subject = data?.email_template_name ?? EmailSubject.WELCOME_EMAIL;

  const html = compileEmailTemplate(template, {
    account_name: payload.account_name,
    package_name: payload.package_name,
    amount: payload.amount,
    status: Status.PENDING,
    date: getCurrentFormattedDate()
  });

  const attachments = await adminService.formatAttachment(EmailType.ORDER_PLACED_EMAIL);

  if (!_.isEmpty(attachments)) {
    await sendEmail(payload.to, subject, html, attachments);
  } else {
    await sendEmail(payload.to, subject, html);
  }
};

export const sendOnHoldCommissionEmail = async (payload: any) => {
  const data = await getEmailTemplateFromDB(EmailType.ON_HOLD_COMMISSION_EMAIL);

  if (!data) {
    logger.error(`No email template found for '${EmailType.ON_HOLD_COMMISSION_EMAIL}'`);
    return;
  }

  const template = data?.html_content ?? '';
  const subject = data?.email_template_name ?? EmailSubject.WELCOME_EMAIL;

  const html = compileEmailTemplate(template, {
    account_name: payload.account_name,
    amount: payload.amount,
    date: getCurrentFormattedDate()
  });

  const attachments = await adminService.formatAttachment(EmailType.UNRELEASED_COMMISSION_EMAIL);

  if (!_.isEmpty(attachments)) {
    await sendEmail(payload.to, subject, html, attachments);
  } else {
    await sendEmail(payload.to, subject, html);
  }
}

export const sendOrderRejectedEmail = async (payload: any) => {
  const data = await getEmailTemplateFromDB(EmailType.ORDER_REJECTED_EMAIL);

  if (!data) {
    logger.error(`No email template found for '${EmailType.ORDER_REJECTED_EMAIL}'`);
    return;
  }

  const template = data?.html_content ?? '';
  const subject = data?.email_template_name ?? EmailSubject.WELCOME_EMAIL;

  const html = compileEmailTemplate(template, {
    account_name: payload.account_name,
    package_name: payload.package_name,
    amount: payload.amount,
    status: Status.REJECTED,
    date: getCurrentFormattedDate()
  });

  const attachments = await adminService.formatAttachment(EmailType.ORDER_REJECTED_EMAIL);

  if (!_.isEmpty(attachments)) {
    await sendEmail(payload.to, subject, html, attachments);
  } else {
    await sendEmail(payload.to, subject, html);
  }
};


export const sendThankyouEmail = async (payload: any) => {
  const data = await getEmailTemplateFromDB(EmailType.THANK_YOU_EMAIL);

  if (!data) {
    logger.error(`No email template found for '${EmailType.THANK_YOU_EMAIL}'`);
    return;
  }

  const template = data?.html_content ?? '';
  const subject = data?.email_template_name ?? EmailSubject.THANK_YOU_EMAIL;

  const html = compileEmailTemplate(template, {
    account_name: payload.account_name,
    package_name: payload.package_name,
    amount: payload.amount ?? 0,
  });

  await sendEmail(payload.to, subject, html);
};

export const sendOrderReadyForPickupEmail = async (payload: any) => {
  const data = await getEmailTemplateFromDB(EmailType.ORDER_READY_FOR_PICKUP_EMAIL);

  if (!data) {
    logger.error(`No email template found for '${EmailType.ORDER_READY_FOR_PICKUP_EMAIL}'`);
    return;
  }

  const template = data?.html_content ?? '';
  const subject = data?.email_template_name ?? EmailSubject.WELCOME_EMAIL;

  const html = compileEmailTemplate(template, {
    account_name: payload.account_name,
    order_number: payload.order_number,
    link: payload.link,
    date: getCurrentFormattedDate(),
  });

  const attachments = await adminService.formatAttachment(EmailType.ORDER_READY_FOR_PICKUP_EMAIL);

  if (!_.isEmpty(attachments)) {
    await sendEmail(payload.to, subject, html, attachments);
  } else {
    await sendEmail(payload.to, subject, html);
  }
};

export const sendOrderPickupConfirmedEmail = async (payload: any) => {
  const data = await getEmailTemplateFromDB(EmailType.ORDER_PICKUP_CONFIRMED_EMAIL);

  if (!data) {
    logger.error(`No email template found for '${EmailType.ORDER_PICKUP_CONFIRMED_EMAIL}'`);
    return;
  }

  const template = data?.html_content ?? '';
  const subject = data?.email_template_name ?? EmailSubject.WELCOME_EMAIL;

  const html = compileEmailTemplate(template, {
    account_name: payload.account_name,
    order_number: payload.order_number,
    link: payload.link,
    date: getCurrentFormattedDate(),
  });

  const attachments = await adminService.formatAttachment(EmailType.ORDER_PICKUP_CONFIRMED_EMAIL);

  if (!_.isEmpty(attachments)) {
    await sendEmail(payload.to, subject, html, attachments);
  } else {
    await sendEmail(payload.to, subject, html);
  }
};

export const sendOrderPaymentEmail = async (payload: any) => {
  const data = await getEmailTemplateFromDB(EmailType.ORDER_PAYMENT_EMAIL);

  if (!data) {
    logger.error(`No email template found for '${EmailType.ORDER_PAYMENT_EMAIL}'`);
    return;
  }

  const template = data?.html_content ?? '';
  const subject = data?.email_template_name ?? EmailSubject.WELCOME_EMAIL;

  const html = compileEmailTemplate(template, {
    account_name: payload.account_name,
    order_number: payload.order_number,
    link: payload.link,
    date: getCurrentFormattedDate(),
  });

  const attachments = await adminService.formatAttachment(EmailType.ORDER_PAYMENT_EMAIL);

  if (!_.isEmpty(attachments)) {
    await sendEmail(payload.to, subject, html, attachments);
  } else {
    await sendEmail(payload.to, subject, html);
  }
};

export const sendReplyToNewApplicantsEmail = async (payload: any) => {
  const data = await getEmailTemplateFromDB(EmailType.REPLY_TO_NEW_APPLICANTS_EMAIL);

  if (!data) {
    logger.error(`No email template found for '${EmailType.REPLY_TO_NEW_APPLICANTS_EMAIL}'`);
    return;
  }

  const template = data?.html_content ?? '';
  const subject = data?.email_template_name ?? EmailSubject.WELCOME_EMAIL;

  const html = compileEmailTemplate(template, {
    account_name: payload.account_name,
    date: getCurrentFormattedDate(),
  });

  const attachments = await adminService.formatAttachment(EmailType.REPLY_TO_NEW_APPLICANTS_EMAIL);

  if (!_.isEmpty(attachments)) {
    await sendEmail(payload.to, subject, html, attachments);
  } else {
    await sendEmail(payload.to, subject, html);
  }
};

export const getEmailTemplateFromDB = async (type: string) => {
  const data = await db.selectFrom('email_template')
    .select([
      'email_template_name',
      'html_content',
      'email_template_type'
    ])
    .where('email_template_type', '=', type)
    .executeTakeFirst();

  return data;
}
