import db from 'src/db/db-client';
import { Template } from '@common/constants/template';
import { EmailTemplate, UpdateEmailTemplate } from '@common/schema/template';
import { IdGenerator } from '@utils/id-generator';
import { generateDateNow } from '@utils/helpers';
import { QueryParams } from '@utils/pagination';
import { EmailType } from '@common/constants/email';
import { AlreadyExistsException } from '@utils/errors';

export const emailService = {
  async getEmails() {
    return await db.selectFrom('email_template').selectAll().execute();
  },

  async createEmailTemplate(data: EmailTemplate) {
    const insertData = {
      email_template_id: IdGenerator.generateUUID(),
      email_template_name: data.name,
      email_template_type: data.type,
      html_content: data.content,
      created_at: generateDateNow(),
      updated_at: generateDateNow()
    };

    try {
      await db.insertInto('email_template').values(insertData).execute();
    } catch (error: any) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new AlreadyExistsException('Email Type Already Exists.');
      }
      throw error;
    }

    return true;
  },

  async updateEmailTemplate(templateId: string, data: UpdateEmailTemplate) {
    const updateData = {
      email_template_name: data?.name,
      email_template_type: data?.type,
      html_content: data.content
    };

    await db.updateTable('email_template').set(updateData).where('email_template_id', '=', templateId).execute();

    return true;
  },

  async deleteEmailTemplate(templateId: string) {
    await db.deleteFrom('email_template').where('email_template_id', '=', templateId).execute();

    return true;
  },

  getEmailVariables(q: QueryParams) {
    switch (q.type) {
      case EmailType.WELCOME_EMAIL:
        return Template.WELCOME_VARIABLES;
      case EmailType.REJECTED_EMAIL:
        return Template.REJECTED_VARIABLES;
      case EmailType.THANK_YOU_EMAIL:
        return Template.THANK_YOU_VARIABLES;
      case EmailType.PENDING_EMAIL:
        return Template.PENDING_VARIABLES;
      case EmailType.ACTIVATED_ACCOUNT_EMAIL:
        return Template.ACTIVATED_ACCOUNT_VARIABLES;
      case EmailType.USED_REFERRAL_EMAIL:
        return Template.USED_REFERRAL_VARIABLES;
      case EmailType.ORDER_STATUS_UPDATE_EMAIL:
        return Template.ORDER_STATUS_UPDATE_VARIABLES;
      case EmailType.ORDER_PLACED_EMAIL:
        return Template.ORDER_PENDING_VARIABLES;
      case EmailType.ORDER_READY_FOR_PICKUP_EMAIL:
        return Template.ORDER_PICKUP_VARIABLES;
      case EmailType.ORDER_PICKUP_CONFIRMED_EMAIL:
        return Template.ORDER_PICKUP_CONFIRMED_VARIABLES;
      case EmailType.ORDER_REJECTED_EMAIL:
        return Template.ORDER_REJECTED_VARIABLES
      case EmailType.ORDER_PAYMENT_EMAIL:
        return Template.ORDER_PAYMENT_VARIABLES;
      case EmailType.REPLY_TO_NEW_APPLICANTS_EMAIL:
        return Template.REPLY_TO_NEW_APPLICANTS_VARIABLES
      case EmailType.ON_HOLD_COMMISSION_EMAIL:
        return Template.ON_HOLD_COMMISSION_VARIABLES
      default:
        return Template.EMAIL_VARIABLES;
    }
  },

  getAllEmailTypes() {
    return EmailType.ALL_TYPES;
  }
};
