import { Status } from '@common/constants/status';
import { CreateTicket } from '@common/schema/ticket';
import { BadRequestException, NotFoundException } from '@utils/errors';
import { filterByTicket } from '@utils/filters';
import { generateDateNow, generateTicketCode, realtime } from '@utils/helpers';
import { IdGenerator } from '@utils/id-generator';
import logger from '@utils/logger';
import { generateMeta, getTotalRecords, QueryParams } from '@utils/pagination';
import { sql } from 'kysely';
import _ from 'lodash';
import db from 'src/db/db-client';
import { accountService } from '@features/account/account.service';
import { Channel, Event } from '@common/constants/realtime';
import { Chat } from '@common/constants/chat';
import { Ticket } from 'src/db/generated/generated-types';
import { Role } from '@common/constants/roles';

export const ticketService = {
  async getTickets({ accountId, q, role }: { accountId?: string; q: QueryParams; role?: string }) {
    let tickets = db
      .selectFrom('ticket as t')
      .leftJoin('account as csr', 't.csr_id', 'csr.account_id')
      .innerJoin('account as a', 't.account_id', 'a.account_id')
      .innerJoin('chat as c', 't.chat_id', 'c.chat_id')
      .select([
        't.ticket_id',
        'c.chat_id',
        'csr.account_id as csr_account_id',
        sql`CONCAT(csr.account_first_name, ' ', csr.account_last_name)`.as('csr_name'),
        'a.account_id as account_id',
        sql`CONCAT(a.account_first_name, ' ', a.account_last_name)`.as('customer_name'),
        'a.account_email as customer_email',
        't.ticket_number',
        't.ticket_subject',
        't.ticket_description',
        't.ticket_status',
        't.created_at',
        't.updated_at'
      ])
      .$call((eb) => filterByTicket(eb, q, 't'))
      .where('c.chat_type', '=', Chat.TYPE_SUPPORT)
      .orderBy('t.created_at', 'desc');

    if (accountId) {
      if (role === Role.DISTRIBUTOR) {
        tickets = tickets.where('a.account_id', '=', accountId);
      }

      if (Role.STAFF_ROLES.includes(role ?? '')) {
        tickets = tickets.where('t.csr_id', '=', accountId);
      }
    }

    const totalRecords = await getTotalRecords(tickets);

    const meta = generateMeta(q, totalRecords);

    const records = await tickets.execute();

    const formattedData = records.map((record: Ticket) => {
      return {
        ...record,
        channel: `chat:${record.chat_id}`
      };
    });

    return { data: formattedData, meta };
  },

  async createTicket(accountId: string, ticketData: CreateTicket) {
    const chatData = {
      chat_id: IdGenerator.generateUUID(),
      is_group: 0,
      chat_type: Chat.TYPE_SUPPORT,
      created_at: generateDateNow(),
      updated_at: generateDateNow()
    };

    let data = {
      ticket_id: IdGenerator.generateUUID(),
      chat_id: chatData.chat_id,
      csr_id: null,
      account_id: accountId,
      ticket_number: generateTicketCode(),
      ticket_subject: ticketData.subject,
      ticket_description: ticketData.description,
      ticket_status: ticketData.status,
      created_at: generateDateNow(),
      updated_at: generateDateNow()
    };

    const account = await accountService.getAccountDetails(accountId);

    try {
      await db.insertInto('chat').values(chatData).execute();
      await db.insertInto('ticket').values(data).execute();

      realtime(Channel.GLOBAL_NOTIF_ADMIN, Event.NEW_TICKET, {
        ticketData: data,
        account: account
      });
    } catch (error) {
      logger.error('Error creating ticket:', error);
      throw new Error('Failed to create ticket.');
    }

    data = _.assign(data, {
      channel: `chat:${chatData.chat_id}`
    });

    return data;
  },

  async hasOnGoingTicket(accountId: string) {
    const ticket = await db.selectFrom('ticket').selectAll().where('account_id', '=', accountId).where('ticket_status', 'in', [Status.OPEN, Status.IN_PROGRESS]).executeTakeFirst();

    return !_.isEmpty(ticket);
  },

  async findTicketById(ticketId: string) {
    const ticket = await db
      .selectFrom('ticket')
      .select(['ticket_id', 'chat_id', 'account_id', 'ticket_number', 'ticket_subject', 'ticket_description', 'ticket_status', 'created_at', 'updated_at'])
      .where('ticket_id', '=', ticketId)
      .executeTakeFirstOrThrow(() => new NotFoundException('Ticket not found.'));

    return ticket;
  },

  async setTicketStatus(ticketId: string, status: string) {
    const ticket = await this.findTicketById(ticketId);

    if (ticket.ticket_status === Status.RESOLVED && status === Status.RESOLVED) {
      throw new BadRequestException('Ticket is already resolved.');
    }

    try {
      await db.updateTable('ticket').set({ ticket_status: status }).where('ticket_id', '=', ticketId).execute();
    } catch (error) {
      logger.error('Error updating ticket status:', error);
      throw new BadRequestException('Failed to update ticket status.');
    }

    return true;
  },

  async setCsrToTicket(ticketId: string, csrId: string) {
    try {
      await db.updateTable('ticket').set({ csr_id: csrId }).where('ticket_id', '=', ticketId).execute();
    } catch (error) {
      logger.error('Error assigning CSR to ticket:', error);
      throw new BadRequestException('Failed to assign CSR to ticket.');
    }

    return true;
  }
};
