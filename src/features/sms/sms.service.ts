import { SmsTemplate } from '@common/schema/template';
import { generateDateNow } from '@utils/helpers';
import { IdGenerator } from '@utils/id-generator';
import db from 'src/db/db-client';
import { Template } from '@common/constants/template';
import { SMS } from '@common/constants/sms';
import { QueryParams } from '@utils/pagination';

export const smsService = {
  async getSmsTemplates() {
    return await db.selectFrom('sms_template').selectAll().execute();
  },

  async createSmsTemplate(data: SmsTemplate) {
    const insertData = {
      sms_template_id: IdGenerator.generateUUID(),
      sms_template_name: data.name,
      sms_template_type: data.type,
      sms_content: data.content,
      created_at: generateDateNow(),
      updated_at: generateDateNow()
    };

    await db.insertInto('sms_template').values(insertData).execute();

    return true;
  },

  async updateSmsTemplate(templateId: string, data: SmsTemplate) {
    const updateData = {
      sms_template_name: data?.name,
      sms_template_type: data?.type,
      sms_content: data?.content
    };

    await db.updateTable('sms_template').set(updateData).where('sms_template_id', '=', templateId).execute();

    return true;
  },

  async deleteSmsTemplate(templateId: string) {
    await db.deleteFrom('sms_template').where('sms_template_id', '=', templateId).execute();

    return true;
  },

  getSmsVars() {
    return Template.SMS_VARIABLES;
  },

  getSmsTypes(q: QueryParams) {
    switch (q.type) {
      case SMS.TYPE_ORDER_APPROVED:
        return SMS.TYPES;
      default:
        return SMS.TYPES;
    }
  }
};

