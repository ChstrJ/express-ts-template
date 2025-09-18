export class Email {
    static WELCOME_EMAIL = 'welcome-email.hbs';
    static ORDER_STATUS_UPDATE = 'order-status-update.hbs';
    static USED_REFERRAL = 'used-referral.hbs';
    static ACTIVATED_ACCOUNT = 'activated-account.hbs';
}

export class EmailType {
    static WELCOME_EMAIL = 'welcome_email';
    static PENDING_EMAIL = 'pending_email';
    static REJECTED_EMAIL = 'rejected_email';
    static THANK_YOU_EMAIL = 'thank_you_email';
    static ORDER_STATUS_UPDATE_EMAIL = 'order_status_update_email';
    static USED_REFERRAL_EMAIL = 'used_referral_email';
    static ACTIVATED_ACCOUNT_EMAIL = 'activated_account_email';

    static ALL_TYPES = [
        this.WELCOME_EMAIL,
        this.PENDING_EMAIL,
        this.REJECTED_EMAIL,
        this.THANK_YOU_EMAIL,
        this.ORDER_STATUS_UPDATE_EMAIL,
        this.USED_REFERRAL_EMAIL,
        // this.ACTIVATED_ACCOUNT
    ]
}

export class EmailSubject {
    static WELCOME_EMAIL = 'Welcome to MLM';
    static REJECTED_EMAIL = 'Your Account Has Been Rejected!';
    static PENDING_EMAIL = 'Your Account is waiting for approval!';
    static THANK_YOU_EMAIL = 'Thank you for your payment.';
    static ORDER_STATUS_UPDATE_EMAIL = 'Your Order Update';
    static USED_REFERRAL_EMAIL = 'Congrats! Someone Used Your Referral Code!';
    static ACTIVATED_ACCOUNT_EMAIL = 'Account Has Been Activated!';
}
