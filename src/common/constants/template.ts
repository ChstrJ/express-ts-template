export class Template {
  static ACCOUNT_ID = '{{account_id}}';
  static ACCOUNT_NAME = '{{account_name}}';
  static ACCOUNT_EMAIL = '{{account_email}}';
  static ACCOUNT_CONTACT_NUMBER = '{{account_contact_number}}';
  static ACCOUNT_ROLE = '{{account_role}}';
  static PACKAGE_NAME = '{{package_name}}';
  static PACKAGE_PRICE = '{{package_price}}';
  static REFERRED_NAME = '{{referred_name}}';
  static REFERRAL_CODE = '{{referral_code}}';
  static STATUS = '{{status}}';
  static LINK = '{{link}}';
  static DATE = '{{date}}';

  static ORDER_ID = '{{order_id}}';
  static ORDER_NUMBER = '{{order_number}}';
  static ORDER_STATUS = '{{order_status}}';
  static ORDER_TOTAL = '{{order_total}}';
  static AMOUNT = '{{amount}}';

  static SMS_VARIABLES = [this.ACCOUNT_NAME, this.LINK, this.AMOUNT, this.ORDER_STATUS];
  static EMAIL_VARIABLES = [this.ACCOUNT_EMAIL, this.ACCOUNT_NAME, this.PACKAGE_NAME, this.LINK];

  static WELCOME_VARIABLES = [
    this.ACCOUNT_NAME,
    this.PACKAGE_NAME,
    this.AMOUNT,
    this.STATUS,
    // this.LINK
  ];

  static THANK_YOU_VARIABLES = [
    this.ACCOUNT_NAME,
    this.PACKAGE_NAME,
    this.AMOUNT
  ];

  static REJECTED_VARIABLES = [
    this.ACCOUNT_NAME,
    this.PACKAGE_NAME,
  ];

  static PENDING_VARIABLES = [
    this.ACCOUNT_NAME,
    this.PACKAGE_NAME,
    this.DATE,
    this.AMOUNT,
    this.STATUS
  ];

  static REPLY_TO_NEW_APPLICANTS_VARIABLES = [
    this.ACCOUNT_NAME,
    this.DATE,
  ];

  static ACTIVATED_ACCOUNT_VARIABLES = [
    this.ACCOUNT_NAME,
    this.PACKAGE_NAME,
  ];

  static USED_REFERRAL_VARIABLES = [
    this.ACCOUNT_NAME,
    this.REFERRED_NAME,
    this.REFERRAL_CODE,
    //  this.LINK
  ];

  static ORDER_STATUS_UPDATE_VARIABLES = [
    this.ACCOUNT_NAME,
    this.ORDER_ID,
    this.ORDER_STATUS,
    //  this.LINK
  ];

  static ORDER_PICKUP_VARIABLES = [
    this.ACCOUNT_NAME,
    this.ORDER_NUMBER,
    this.LINK,
    this.DATE
  ];

static ORDER_PICKUP_CONFIRMED_VARIABLES = [
    this.ACCOUNT_NAME,
    this.ORDER_NUMBER,
    this.LINK,
    this.DATE
  ];

  static ORDER_PAYMENT_VARIABLES = [
    this.ACCOUNT_NAME,
    this.ORDER_NUMBER,
    this.LINK,
    this.DATE
  ];

  static ORDER_SHIPPED_VARIABLES = [
    this.ACCOUNT_NAME,
    this.ORDER_NUMBER,
    this.LINK,
    this.DATE
  ];

  static ORDER_REJECTED_VARIABLES = [
    this.ACCOUNT_NAME,
    this.ORDER_NUMBER,
    this.LINK,
    this.DATE
  ];

  static ORDER_PENDING_VARIABLES = [
    this.ACCOUNT_NAME,
    this.ORDER_NUMBER,
    this.LINK,
    this.DATE
  ];

  static ON_HOLD_COMMISSION_VARIABLES = [
    this.ACCOUNT_NAME,
    this.AMOUNT,
    this.DATE
  ]
}
