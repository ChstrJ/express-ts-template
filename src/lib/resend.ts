import { Resend } from 'resend';
import dotenv from 'dotenv';
import logger from '@utils/logger';
dotenv.config();

const KEY = process.env.RESEND_API_KEY ?? '';

const resend = new Resend(KEY);

const from = 'MLM Support <mlm-support@win-mlm.online>';

export const sendEmail = async (to: string | string[], subject: string, html: string, attachments?: any) => {
  if (process.env.EMAIL_ENABLED !== 'true') {
    logger.info('Email sending is not enabled.');
    return;
  }

  await resend.emails.send({
    from: from,
    to,
    subject,
    html,
    attachments
  });
};
