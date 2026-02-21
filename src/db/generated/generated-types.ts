import type { ColumnType } from "kysely";
export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>;
export type Timestamp = ColumnType<Date, Date | string, Date | string>;

export type Account = {
    account_id: string;
    account_first_name: string;
    account_last_name: string;
    account_email: string;
    account_password: string;
    account_role: string;
    account_status: string | null;
    account_image: string | null;
    account_contact_number: string;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp;
};
export type AccountActivity = {
    account_activity_id: string;
    account_id: string;
    activity_id: string | null;
    activity_type: string | null;
    activity_message: string | null;
    activity_meta: unknown | null;
    action: string;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp;
};
export type AccountNotification = {
    account_notification_id: string;
    account_id: string;
    code: string;
    content: unknown | null;
    is_read: number;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp;
};
export type AccountPaymentMethod = {
    account_payment_method_id: string;
    account_id: string;
    payment_method: string;
    payment_method_name: string;
    payment_method_number: string;
    payment_method_qr_code: string | null;
    payment_method_status: Generated<string | null>;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp;
};
export type AccountPermission = {
    account_permission_id: string;
    account_id: string;
    permission_meta: unknown | null;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp;
};
export type AccountProductPackage = {
    account_product_package_id: string;
    account_id: string;
    product_package_id: string | null;
    product_package_price: string | null;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp;
};
export type AccountPV = {
    account_pv_id: string;
    account_id: string;
    pv: string | null;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp;
};
export type AccountReason = {
    account_reason_id: string;
    account_id: string;
    reason_type: string | null;
    reason_message: string | null;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp;
};
export type AccountReferral = {
    account_referral_id: string;
    account_id: string;
    referred_by_id: string | null;
    referral_code_id: string | null;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp;
};
export type AccountTreePath = {
    ancestor_id: string;
    descendant_id: string;
    depth: number;
};
export type AppSettings = {
    app_settings_id: string;
    key: string | null;
    value: string | null;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp;
};
export type Chat = {
    chat_id: string;
    is_group: Generated<number>;
    chat_type: string | null;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp;
};
export type ChatMessages = {
    chat_messages_id: string;
    chat_id: string | null;
    sender_id: string | null;
    content: string | null;
    is_deleted: Generated<number | null>;
    is_read: Generated<number | null>;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp;
};
export type ChatParticipants = {
    chat_participants_id: string;
    chat_id: string | null;
    account_id: string | null;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp;
};
export type Commission = {
    commission_id: string;
    account_id: string;
    transaction_account_id: string;
    commission_amount: string | null;
    commission_status: Generated<string>;
    commission_type: Generated<string | null>;
    released_at: Timestamp | null;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp;
};
export type CommissionLevel = {
    commission_level_id: string;
    commission_level: number | null;
    commission_percentage: string | null;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp;
};
export type EmailTemplate = {
    email_template_id: string;
    email_template_name: string | null;
    email_template_type: string | null;
    html_content: string | null;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp;
};
export type File = {
    file_id: string;
    file_name: string;
    file_path: string;
    file_type: string;
    file_status: Generated<string>;
    file_doc_type: string | null;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp;
};
export type Order = {
    order_id: string;
    order_number: string | null;
    account_id: string;
    order_status: Generated<string | null>;
    total_amount: string | null;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp;
};
export type OrderItem = {
    order_item_id: string;
    order_id: string;
    product_id: string;
    quantity: number | null;
    price: string | null;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp;
};
export type OrderPayment = {
    order_payment_id: string;
    order_id: string;
    payment_method_id: string | null;
    order_payment_image: string | null;
    order_payment_status: Generated<string | null>;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp;
};
export type OrderPickup = {
    order_pickup_id: string;
    order_id: string;
    order_pickup_image: string | null;
    order_pickup_status: string | null;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp;
};
export type PaymentMethod = {
    payment_method_id: string;
    payment_method: string;
    payment_method_name: string;
    payment_method_number: string;
    payment_method_qr_code: string | null;
    payment_method_status: Generated<string | null>;
    payment_method_type: string | null;
    payment_method_ts_type: Generated<string | null>;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp;
};
export type Permission = {
    permission_id: string;
    permission_type: string | null;
    permission_status: string | null;
    permission_meta: unknown | null;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp;
};
export type Product = {
    product_id: string;
    product_category_id: string | null;
    product_name: string;
    product_description: string | null;
    product_price: string;
    product_stock: number;
    product_pv: string | null;
    product_status: Generated<string>;
    product_image: string | null;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp;
};
export type ProductCategory = {
    product_category_id: string;
    product_category: string | null;
    product_category_status: Generated<string | null>;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp;
};
export type ProductLowStock = {
    product_low_stock_id: string;
    product_id: string | null;
    threshold_qty: number;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp;
};
export type ProductPackage = {
    product_package_id: string;
    product_package_name: string;
    product_package_description: string | null;
    product_package_price: string;
    product_package_status: Generated<string>;
    product_package_image: string | null;
    product_package_pv: string | null;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp;
};
export type ProductPackageProduct = {
    product_package_product_id: string;
    product_id: string;
    product_package_id: string;
};
export type ProductPosition = {
    product_position_id: string;
    product_id: string;
    position_no: string;
};
export type ProductStockHistory = {
    product_stock_history_id: string;
    product_id: string;
    account_id: string | null;
    quantity_change: number | null;
    current_stock: number | null;
    type: string;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp;
};
export type Ranks = {
    ranks_id: string;
    name: string;
    pv_req: string | null;
    gv_req: string | null;
    leg_cap: string | null;
    meta: unknown | null;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp;
};
export type RanksMonthlySnapshot = {
    ranks_monthly_snapshot_id: string;
    account_id: string;
    ranks_id: string | null;
    ranks_name: string | null;
    pv: string | null;
    gv: string | null;
    month: string | null;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp;
};
export type RanksSnapshot = {
    ranks_snapshot_id: string;
    account_id: string;
    ranks_id: string | null;
    ranks_name: string | null;
    pv: string | null;
    gv: string | null;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp;
};
export type ReferralCode = {
    referral_code_id: string;
    referral_code: string;
    account_id: string;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp;
};
export type RefreshToken = {
    refresh_token_id: string;
    account_id: string;
    refresh_token: string;
    expires_at: Timestamp;
    revoked: Generated<number>;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp;
};
export type Sales = {
    sales_id: string;
    account_id: string;
    sales_type: string | null;
    sales_amount: string | null;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp;
};
export type Sms = {
    sms_id: string;
    account_id: string;
    is_send: number;
    sms_code: string;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp;
};
export type SmsTemplate = {
    sms_template_id: string;
    sms_template_name: string | null;
    sms_template_type: string | null;
    sms_content: string;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp;
};
export type Team = {
    team_id: string;
    team_name: string | null;
    team_leader_id: string;
    team_status: string | null;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp;
};
export type Ticket = {
    ticket_id: string;
    csr_id: string | null;
    account_id: string;
    chat_id: string;
    ticket_number: string | null;
    ticket_subject: string | null;
    ticket_description: string | null;
    ticket_status: string | null;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp;
};
export type Wallet = {
    wallet_id: string;
    account_id: string;
    wallet_amount: string;
    wallet_status: Generated<string>;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp;
};
export type WalletTransaction = {
    wallet_transaction_id: string;
    wallet_id: string;
    withdrawal_id: string | null;
    wallet_transaction_amount: string;
    wallet_transaction_type: string;
    wallet_transaction_title: string | null;
    wallet_transaction_status: Generated<string>;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp;
};
export type Withdrawal = {
    withdrawal_id: string;
    account_id: string;
    withdrawal_amount: string;
    withdrawal_status: Generated<string>;
    ref_no: string | null;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp;
};
export type DB = {
    account: Account;
    account_activity: AccountActivity;
    account_notification: AccountNotification;
    account_payment_method: AccountPaymentMethod;
    account_permission: AccountPermission;
    account_product_package: AccountProductPackage;
    account_pv: AccountPV;
    account_reason: AccountReason;
    account_referral: AccountReferral;
    account_tree_path: AccountTreePath;
    app_settings: AppSettings;
    chat: Chat;
    chat_messages: ChatMessages;
    chat_participants: ChatParticipants;
    commission: Commission;
    commission_level: CommissionLevel;
    email_template: EmailTemplate;
    file: File;
    order: Order;
    order_item: OrderItem;
    order_payment: OrderPayment;
    order_pickup: OrderPickup;
    payment_method: PaymentMethod;
    permission: Permission;
    product: Product;
    product_category: ProductCategory;
    product_low_stock: ProductLowStock;
    product_package: ProductPackage;
    product_package__product: ProductPackageProduct;
    product_position: ProductPosition;
    product_stock_history: ProductStockHistory;
    ranks: Ranks;
    ranks_monthly_snapshot: RanksMonthlySnapshot;
    ranks_snapshot: RanksSnapshot;
    referral_code: ReferralCode;
    refresh_token: RefreshToken;
    sales: Sales;
    sms: Sms;
    sms_template: SmsTemplate;
    team: Team;
    ticket: Ticket;
    wallet: Wallet;
    wallet_transaction: WalletTransaction;
    withdrawal: Withdrawal;
};
