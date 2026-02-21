
export class Log {
    static TYPE_ACCOUNT_ACTIVITY = 'account_activity';
    static TYPE_ORDER = 'order';
    static TYPE_ORDER_PAYMENT = 'order_payment';
    static TYPE_PAYMENT = 'payment';
    static TYPE_PRODUCT = 'product';
    static TYPE_WITHDRAWAL = 'withdrawal';
    static TYPE_REFUND = 'refund';
    static TYPE_COMMISSION = 'commission';
    static TYPE_BONUS = 'bonus';
    static TYPE_ACCOUNT = 'account';
    static TYPE_COMMISSION_LEVEL = 'commission_level';
    static TYPE_SETTINGS = 'settings';
    static TYPE_RANK = 'rank';
    static TYPE_TICKET = 'ticket';
    static TYPE_PAYMENT_METHOD = 'payment_method';

    static ACTION_CREATE = 'create';
    static ACTION_UPDATE = 'update';
    static ACTION_DELETE = 'delete';
    static ACTION_VIEW = 'view';

    static orderMessage(orderId: string) {
        return `Order ${orderId} has been processed.`;
    }

    static paymentMessage(paymentId: string) {
        return `Payment ${paymentId} has been processed.`;
    }

    static withdrawalMessage(withdrawalId: string) {
        return `Withdrawal ${withdrawalId} has been processed.`;
    }
}