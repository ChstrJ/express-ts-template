import { Email, EmailType } from "@common/constants/email";
import { getEmailTemplate } from "@lib/handlerbars";
import { generateDateNow } from "@utils/helpers";
import { IdGenerator } from "@utils/id-generator";
import db from "src/db/db-client";

const seedEmailTemplates = async () => {
    //const welcomeTemplate = getEmailTemplate(Email.WELCOME_EMAIL);
    const welcomeTemplate = `<p>Hello {{account_name}},</p><p></p><p>Congratulations and welcome to the MLM WIN Distributor family! Please wait for the team to review your account. So please pay up the package first so we have a smooth transaction</p><p></p><p></p><p>To activate your business account, please settle the Distributor Package:</p><p></p><p>Package: {{package_name}} ,  ₱ 10,000</p><p></p><p>Bank Transfer: (Bank Name), (Account Name), (Account No.)</p><p></p><p>GCash: (GCash Number / Name)</p><p></p><p>Online Link: (Secure payment link)</p><p></p><p>After payment, do one of the following:</p><p></p><p>Upload your proof of payment at (Upload Portal Link), or</p><p>Reply to this email with the screenshot/receipt and reference number.</p><p>Once payment is confirmed, we’ll activate your business account and send your login details plus your onboarding kit.</p><p></p><p>If you have any questions, just hit reply or contact us at (<a target="_blank" rel="noopener noreferrer nofollow" href="mailto:support@company.com">support@company.com</a>) / (Hotline).</p><p></p><p>We’re excited to grow with you!</p><p></p><p>Warm regards,</p>`;

    const pendingTemplate = `<p>Hello {{account_name}},</p><p></p><p>Congratulations and welcome to the MLM WIN Distributor family! Please wait for the team to review your account. So please pay up the package first so we have a smooth transaction</p><p></p><p></p><p>To activate your business account, please settle the Distributor Package:</p><p></p><p>Package: {{package_name}} ,  ₱ 10,000</p><p></p><p>Bank Transfer: (Bank Name), (Account Name), (Account No.)</p><p></p><p>GCash: (GCash Number / Name)</p><p></p><p>Online Link: (Secure payment link)</p><p></p><p>After payment, do one of the following:</p><p></p><p>Upload your proof of payment at (Upload Portal Link), or</p><p>Reply to this email with the screenshot/receipt and reference number.</p><p>Once payment is confirmed, we’ll activate your business account and send your login details plus your onboarding kit.</p><p></p><p>If you have any questions, just hit reply or contact us at (<a target="_blank" rel="noopener noreferrer nofollow" href="mailto:support@company.com">support@company.com</a>) / (Hotline).</p><p></p><p>We’re excited to grow with you!</p><p></p><p>Warm regards,</p>`;

    //   const orderStatusUpdateTemplate = getEmailTemplate(Email.ORDER_STATUS_UPDATE);

    const orderStatusUpdateTemplate = `<p>Hello  {{account_name}} ,</p><p></p><p>Your Order Status is  {{order_status}} .</p><p></p><p> {{link}} </p><p></p><p></p>`;

    const usedReferral = `<p>Congratulation  {{account_name}} ,</p><p></p><p>There is someone who use your referral and approved, check your updated balance to see the commission that you got.</p><p></p><p>Warm Regards,</p><p></p>`;

    //   const activatedAccountTemplate = getEmailTemplate(Email.ACTIVATED_ACCOUNT);

    const rejectedEmail = `<p>Hello {{account_name}},</p><p></p><p>Your application was rejected due to {{ reason }}.</p><p></p><p>Please try to re-apply again if we are wrong we will going to verify again this.</p><p></p><p>warm regards,</p>`;

    const records = [
        {
            email_template_id: IdGenerator.generateUUID(),
            email_template_name: 'Welcome Email',
            email_template_type: EmailType.WELCOME_EMAIL,
            html_content: welcomeTemplate,
            created_at: generateDateNow(),
            updated_at: generateDateNow()
        },
        {
            email_template_id: IdGenerator.generateUUID(),
            email_template_name: 'Pending Email',
            email_template_type: EmailType.PENDING_EMAIL,
            html_content: pendingTemplate,
            created_at: generateDateNow(),
            updated_at: generateDateNow()
        },
        {
            email_template_id: IdGenerator.generateUUID(),
            email_template_name: 'Order Status Update',
            email_template_type: EmailType.ORDER_STATUS_UPDATE_EMAIL,
            html_content: orderStatusUpdateTemplate,
            created_at: generateDateNow(),
            updated_at: generateDateNow()
        },
        {
            email_template_id: IdGenerator.generateUUID(),
            email_template_name: 'Activated Account',
            email_template_type: EmailType.REJECTED_EMAIL,
            html_content: rejectedEmail,
            created_at: generateDateNow(),
            updated_at: generateDateNow()
        },
        {
            email_template_id: IdGenerator.generateUUID(),
            email_template_name: 'New Referral',
            email_template_type: EmailType.USED_REFERRAL_EMAIL,
            html_content: usedReferral,
            created_at: generateDateNow(),
            updated_at: generateDateNow()
        }
    ]

    await db.insertInto('email_template').values(records).execute();
    console.log('Email templates created successfully');
};

seedEmailTemplates().then(() => {
    process.exit(0);
});

