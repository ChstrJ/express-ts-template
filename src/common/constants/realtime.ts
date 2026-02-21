export class Channel {
  static GLOBAL_NOTIF = 'global-notif';
  static GLOBAL_NOTIF_ADMIN = 'global-notif-admin';
  static GLOBAL_NOTIF_USER = 'global-notif-user';
}

export class Event {
  static NEW_TICKET = 'new-ticket';
  static ASSIGNED_TICKET = 'assigned-ticket';
  static CSR_ASSIGNED_TICKET = 'csr-assigned-ticket';
  static UPDATE_TICKET = 'update-ticket';
  static DELETE_TICKET = 'delete-ticket';
  static NEW_ORDER = 'new-order';
  static UPDATE_ORDER = 'update-order';
  static ORDER = 'order';
  static MESSAGE = 'message';
  static NEW_CHAT = 'new-chat';
  static CHAT_NOTIF = 'chat-notif';
  static CHAT_LIST = 'chat-list';
}
