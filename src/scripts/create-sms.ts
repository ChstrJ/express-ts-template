import { SMS } from "@common/constants/sms";
import { generateDateNow } from "@utils/helpers";
import { IdGenerator } from "@utils/id-generator";
import db from "src/db/db-client";

export const createSms = async () => {
    const message = `Hi, {{account_name}}, Your order has been approved, amounting to ₱{{amount}}. Please send a proof of payment in the dashboard. Link {{link}}`;

    const data = {
        sms_template_id: IdGenerator.generateUUID(),
        sms_template_name: 'Sms Order Approved',
        sms_template_type: SMS.TYPE_ORDER_APPROVED,
        sms_content: message,
        created_at: generateDateNow(),
        updated_at: generateDateNow()
    }

    await db.insertInto('sms_template').values(data).execute();
    console.log('Created sms template.')
}

createSms().then(() => process.exit(1));