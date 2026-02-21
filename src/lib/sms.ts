import { SMS } from '@common/constants/sms';
import { Template } from '@common/constants/template';
import { app } from '@config/app';
import { generateDateNow } from '@utils/helpers';
import logger from '@utils/logger';
import axios from 'axios';
import dotenv from 'dotenv';
import db from 'src/db/db-client';

dotenv.config();

const API_KEY = process.env.SMS_API_KEY;
const BASE_URL = 'https://sms.iprogtech.com/api/v1/sms_messages';

export const sendSms = async (to: string, message: string) => {
  if (process.env.SMS_ENABLED !== 'true') {
    logger.info('SMS sending is not enabled.');
    return;
  }

  try {
    const response = await axios.post(BASE_URL, {
      phone_number: to,
      message: message,
      api_token: API_KEY
    });
    console.log(response.data);
    return response.data;
  } catch (error) {
    console.error('Error sending SMS:', error);
    throw error;
  }
};

export const sendBulkSms = async (recipients: string[], message: string) => {
  if (process.env.SMS_ENABLED !== 'true') {
    logger.info('SMS sending is not enabled.');
    return;
  }

  try {
    const response = await axios.post(`${BASE_URL}/send_bulk`, {
      phone_numbers: recipients.join(','),
      message: message,
      api_token: API_KEY
    });
    return response.data;
  } catch (error) {
    console.error('Error sending bulk SMS:', error);
    throw error;
  }
};

export const getSmsTemplate = async (type: string) => {
  const data = await db
    .selectFrom('sms_template')
    .select([
      'sms_content',
    ])
    .where('sms_template_type', '=', type)
    .executeTakeFirst()

  if (!data) {
    logger.error(`SMS template not found for type: ${type}`);
  }

  return data;
}

export const sendOrderStatusUpdateSms = async (to: string, payload: any) => {
  const data = await getSmsTemplate(SMS.TYPE_ORDER_APPROVED);
  const template = data?.sms_content ?? '';

  if (!template) {
    logger.error('No SMS template found for order status update.');
    return;
  }

  const message = template
    .replace(Template.ACCOUNT_NAME, payload.name)
    .replace(Template.ORDER_STATUS, payload.status)
    .replace(Template.AMOUNT, payload.amount)
    .replace(Template.LINK, app.appUrl + '/order-inventory')
    .replace(Template.DATE, generateDateNow().toLocaleDateString());

  await sendSms(to, message);
}