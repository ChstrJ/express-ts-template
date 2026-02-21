import { Chat } from '@common/constants/chat';
import { Status } from '@common/constants/status';
import { ChatMessage, createChat } from '@common/schema/chat';
import { ablyRest } from '@lib/ably';
import { filterByChatType } from '@utils/filters';
import { generateDateNow, getImageUrl, realtime } from '@utils/helpers';
import { IdGenerator } from '@utils/id-generator';
import logger from '@utils/logger';
import { applyPagination, applySearch, generateMeta, getTotalRecords, QueryParams } from '@utils/pagination';
import { sql } from 'kysely';
import _ from 'lodash';
import db from 'src/db/db-client';
import { Account } from 'src/db/generated/generated-types';
import { accountService } from '@features/account/account.service';
import { Event } from '@common/constants/realtime';

export const chatService = {
  async getChats({ accountId, q }: { accountId: string; q?: QueryParams | any }) {
    const chatIds = await this.getChatIds(accountId);

    if (_.isEmpty(chatIds)) {
      return { data: [], meta: {} };
    }

    const baseQuery = db
      .selectFrom('chat_participants as cp')
      .leftJoin('account as a', 'cp.account_id', 'a.account_id')
      .leftJoin('chat as c', 'cp.chat_id', 'c.chat_id')
      .where('c.chat_id', 'in', chatIds)
      .where('cp.account_id', '!=', accountId)
      .where('c.chat_type', '=', Chat.TYPE_PEER);

    const totalRecords = await getTotalRecords(baseQuery);

    const records = await baseQuery
      .select([
        'c.chat_id',
        'a.account_id',
        sql`CONCAT(a.account_first_name, ' ', a.account_last_name)`.as('account_name'),
        'a.account_email',
        'a.account_role',
        'a.account_image'
      ])
      .$call((qb) => applyPagination(qb, q))
      .execute();

    const meta = generateMeta(q, totalRecords);

    const data = await Promise.all(
      records.map(async (record: any) => {
        return {
          ...record,
          channel: `chat:${record.chat_id}`,
          account_image: getImageUrl(record.account_image),
          latest_message: await this.getLatestMessageV2(record.chat_id),
          unread_count: await this.getUnreadMessageCount(accountId, record.chat_id)
        };
      })
    );

    return { data, meta };
  },

  async getUnreadMessageCount(senderId: string, chatId: string) {
    const data = await db.selectFrom('chat as c')
      .leftJoin('chat_messages as cm', 'c.chat_id', 'cm.chat_id')
      .select([
        sql`COUNT(CASE WHEN cm.is_read = 0 THEN 1 END)`.as('unread_count')
      ])
      .where('cm.sender_id', '!=', senderId)
      .where('c.chat_id', '=', chatId)
      .where('cm.is_read', '=', 0)
      .executeTakeFirst();

    return data?.unread_count || 0;
  },

  async saveMessage(chatId: string, data: ChatMessage) {
    const insertData = {
      chat_messages_id: IdGenerator.generateUUID(),
      chat_id: chatId,
      sender_id: data.sender_id,
      content: data.content,
      created_at: generateDateNow(),
      updated_at: generateDateNow()
    };

    const receiver = await this.getReceiverDetails(chatId, data.sender_id);
    const sender = await accountService.getAccountDetails(data.sender_id);
    const chat = await this.getChatDetails(chatId);

    await this.readMessage(chatId, receiver?.account_id ?? '');

    try {
      await db.insertInto('chat_messages').values(insertData).execute();

      realtime(`chat:${chatId}`, Event.MESSAGE, {
        sender_id: data.sender_id,
        sender_image: sender?.account_image,
        sender_name: sender?.account_name,
        role: sender?.account_role,
        chat_type: chat?.chat_type,
        content: data.content,
        created_at: generateDateNow()
      });

      realtime(`chat-notif:${receiver?.account_id}`, Event.CHAT_NOTIF, {
        message: `You have a new message from ${sender?.account_name}.`,
        sender_id: data.sender_id,
        receiver_id: receiver?.account_id,
        content: data.content,
        sender_name: sender?.account_name,
        role: sender?.account_role,
        channel: `chat:${chatId}`,
        chat_type: chat?.chat_type,
        sender_image: sender?.account_image,
        created_at: generateDateNow()
      });

      const senderChats = await this.getChats({ accountId: data.sender_id, q: {} });

      realtime(`chat-list:${data.sender_id}`, Event.CHAT_LIST, senderChats);
    } catch (err) {
      logger.error(err);
      return false;
    }

    return true;
  },

  async listMessages(chatId: string, accountId: string, q: QueryParams) {
    const receiver = await this.getReceiverDetails(chatId, accountId);

    await this.readMessage(chatId, receiver?.account_id ?? '');

    const baseQuery = db
      .selectFrom('chat_messages as cm')
      .innerJoin('account as a', 'cm.sender_id', 'a.account_id')
      .innerJoin('chat as c', 'cm.chat_id', 'c.chat_id')
      .where('c.chat_id', '=', chatId);

    const totalRecords = await getTotalRecords(baseQuery);

    const records = await baseQuery
      .select([
        'cm.chat_messages_id',
        'c.chat_id',
        'a.account_id',
        sql`CONCAT(a.account_first_name, ' ', a.account_last_name)`.as('sender_name'),
        'a.account_role',
        'a.account_image',
        'cm.content',
        'cm.created_at',
        'cm.updated_at'
      ])
      .$call((qb) => filterByChatType(qb, q, 'c'))
      .$call((qb) => applyPagination(qb, q))
      .orderBy('cm.created_at', 'desc')
      .execute();

    const meta = generateMeta(q, totalRecords);

    const data = records.map((record: ChatMessage | any) => {
      return {
        ...record,
        sender: this.getSender(accountId, record),
        account_image: getImageUrl(record.account_image)
      };
    });

    return { data, meta };
  },

  getSender(accountId: string, record: Partial<Account>) {
    return accountId === record.account_id ? 'me' : 'other';
  },

  async createChatOrReturnChat(data: createChat) {
    const existingChat = await db
      .selectFrom('chat_participants as cp1')
      .innerJoin('chat_participants as cp2', 'cp1.chat_id', 'cp2.chat_id')
      .select(['cp1.chat_id'])
      .where('cp1.account_id', '=', data.recipient_id)
      .where('cp2.account_id', '=', data.sender_id)
      .leftJoin('chat as c', 'cp1.chat_id', 'c.chat_id')
      .where('c.chat_type', '=', Chat.TYPE_PEER)
      .limit(1)
      .executeTakeFirst();

    let chatId = existingChat?.chat_id;

    if (_.isEmpty(existingChat)) {
      chatId = IdGenerator.generateUUID();

      const chatData = {
        chat_id: chatId,
        is_group: 0,
        chat_type: Chat.TYPE_PEER,
        created_at: generateDateNow(),
        updated_at: generateDateNow()
      };

      const chatParticipantsData = Object.values(data).map((datum) => {
        return {
          chat_participants_id: IdGenerator.generateUUID(),
          chat_id: chatId,
          account_id: datum,
          created_at: generateDateNow(),
          updated_at: generateDateNow()
        };
      });

      await db.insertInto('chat').values(chatData).execute();
      await db.insertInto('chat_participants').values(chatParticipantsData).execute();
    }

    return `chat:${chatId}`;
  },

  async getChatIds(accountId: string) {
    const records = await db.selectFrom('chat_participants').select(['chat_id']).where('account_id', '=', accountId).execute();

    return records.map((record) => record.chat_id);
  },

  async getOnlineAccounts(accountId: string, q: QueryParams) {
    const baseQuery = db.selectFrom('account as a')
      .where('a.account_status', '=', Status.ACTIVE)
      .where('a.account_id', '!=', accountId);

    const totalRecords = await getTotalRecords(baseQuery);

    const records = await baseQuery
      .select([
        'a.account_id',
        sql<string>`CONCAT(a.account_first_name, ' ', a.account_last_name)`.as('account_name'),
        'a.account_email',
        'a.account_image',
        'a.account_role'
      ])
      .$call((qb) => applySearch(qb, q))
      .$call((qb) => applyPagination(qb, q))
      .execute();

    const meta = generateMeta(q, totalRecords);

    const data = records.map((record: Account | any) => {
      return {
        ...record,
        account_image: getImageUrl(record.account_image)
      };
    });

    return { data, meta };
  },

  async getLatestMessage(accountId: string) {
    const chatIds = await this.getChatIds(accountId);

    const records = await db
      .selectFrom('chat_messages as cm')
      .innerJoin(
        (eb) =>
          eb
            .selectFrom('chat_messages')
            .select([
              'chat_id',
              sql`MAX(created_at)`.as('latest_created_at'),
            ])
            .where('chat_id', 'in', chatIds)
            .groupBy('chat_id')
            .as('latest_msgs'),
        (join) => join.onRef('cm.chat_id', '=', 'latest_msgs.chat_id').onRef('cm.created_at', '=', 'latest_msgs.latest_created_at')
      )
      .innerJoin('account as a', 'cm.sender_id', 'a.account_id')
      .select([
        'cm.chat_id',
        'cm.sender_id',
        'cm.content',
        sql`CONCAT(a.account_first_name, ' ', a.account_last_name)`.as('account_name'),
        'cm.created_at'
      ])
      .execute();

    return new Map(records.map((record) => [record.chat_id, record]));
  },

  async getLatestMessageV2(chatId: string) {
    const records = await db
      .selectFrom('chat_messages as cm')
      .innerJoin('account as a', 'cm.sender_id', 'a.account_id')
      .select([
        'cm.chat_id',
        'cm.sender_id',
        'cm.content',
        sql`CONCAT(a.account_first_name, ' ', a.account_last_name)`.as('account_name'),
        'cm.created_at'
      ])
      .where('cm.chat_id', '=', chatId)
      .orderBy('cm.created_at', 'desc')
      .limit(1)
      .executeTakeFirst();

    return records;
  },

  async getReceiverDetails(chatId: string, accountId: string) {
    const records = await db.selectFrom('chat_participants')
      .select(['account_id'])
      .where('chat_id', '=', chatId)
      .where('account_id', '!=', accountId)
      .executeTakeFirst();

    return records;
  },

  async getChatDetails(chatId: string) {
    const records = await db.selectFrom('chat')
      .select([
        'chat_id',
        'chat_type'
      ])
      .where('chat_id', '=', chatId)
      .executeTakeFirst();

    return records;
  },

  async getSenderDetails(chatId: string, accountId: string) {
    const records = await db
      .selectFrom('chat_participants as cp')
      .innerJoin('account as a', 'cp.account_id', 'a.account_id')
      .select([
        'cp.account_id',
        sql<string>`CONCAT(a.account_first_name, ' ', a.account_last_name)`.as('sender_name'),
        'a.account_role'
      ])
      .where('cp.chat_id', '=', chatId)
      .where('a.account_id', '=', accountId)
      .executeTakeFirst();

    return records;
  },

  async readMessage(chatId: string, accountId: string) {
    console.log(chatId, accountId);
    try {
      await db
        .updateTable('chat_messages')
        .set({ is_read: 1 })
        .where((eb) => eb.and([eb('chat_id', '=', chatId), eb('is_read', '=', 0), eb('sender_id', '=', accountId)]))
        .execute();
    } catch (error) {
      console.error('Error reading message:', error);
      return false;
    }

    return true;
  }
};
