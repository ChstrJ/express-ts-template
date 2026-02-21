import db from 'src/db/db-client';
import _ from 'lodash';
import { IdGenerator } from './id-generator';
import dotenv from 'dotenv';
import { accountService } from '@features/account/account.service';
import { adminService } from '@features/admin/admin.service';
import { Status } from '@common/constants/status';
import { NotifCode } from '@common/constants/notifs-code';
import { v5 as uuidv5 } from 'uuid';
import { Request } from 'express';
import { app } from '@config/app';
import { ablyRest } from '@lib/ably';
import axios from 'axios';
import validator from 'validator';
import { faker } from '@faker-js/faker';
import { Activity } from './types';
import dayjs from 'dayjs';
import { NotFoundException } from './errors';

dotenv.config();
const DNS_NAMESPACE = uuidv5.DNS;

export function dd(...args: any) {
  for (const arg of args) {
    console.dir(arg, { depth: null, colors: true });
  }
  process.exit(1);
}

export function generateRandom(length: number = 6) {
  let result = '';

  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const charactersLength = characters.length;

  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
}

export function generateOrderNumber(length: number = 5) {
  const result = generateRandom(length);
  const date = dayjs().format("YYYYMMDD");
  return `${result}-${date}`;
}

export function generateProductCode(length: number = 5) {
  const result = generateRandom(length);
  return `PROD-${result}`;
}

export function generateTeamName() {
  const animal = faker.animal.type();
  const color = faker.color.human();
  return `${color} ${animal}`;
}

export function generateTicketCode(length: number = 5): string {
  const result = generateRandom(length);
  return `TKT-${result}`;
}

export function generateReferralCode(length: number = 6): string {
  const result = generateRandom(length);
  const currentYear = new Date().getFullYear();
  return result + currentYear;
}

export async function getRandomAdmin() {
  return await db.selectFrom('account').selectAll().where('account_role', '=', 'admin').executeTakeFirst();
}

export async function getAccount(email: string) {
  return await db.selectFrom('account').selectAll().where('account_email', '=', email).executeTakeFirst();
}

export function generateImageKey(name: string) {
  const key = IdGenerator.generateNanoidWithPrefix({ prefix: name, length: 24 });
  return `i/${name}/${key}`;
}

export function generateProductImageKey() {
  const key = IdGenerator.generateNanoidWithPrefix({ prefix: 'prod', length: 24 });
  return `i/prod/${key}`;
}

export function generatePaymentMethodKey() {
  const key = IdGenerator.generateNanoidWithPrefix({ prefix: 'pm', length: 24 });
  return `i/pm/${key}`;
}

export function generatePaymentKey() {
  const key = IdGenerator.generateNanoidWithPrefix({ prefix: 'pay', length: 24 });
  return `i/pay/${key}`;
}

export function generateOrderPickupKey() {
  const key = IdGenerator.generateNanoidWithPrefix({ prefix: 'pu', length: 24 });
  return `o/pu/${key}`;
}

export function generateAccountImageKey() {
  const key = IdGenerator.generateNanoidWithPrefix({ prefix: 'acc', length: 24 });
  return `i/acc/${key}`;
}

export function generateFileKey() {
  const key = IdGenerator.generateNanoidWithPrefix({ prefix: 'fl', length: 24 });
  return `f/fl/${key}`;
}

export function getImageUrl(key: string | null) {
  if (!key) {
    return null;
  }

  const r2Url = process.env.R2_URL ?? '';

  return `${r2Url}/${key}`;
}

export function generateDateNow() {
  return new Date();
}

export async function sendNotif(accountId: string | string[], code: string, content: Record<string, any> = {}) {
  return await accountService.sendNotification(accountId, code, content);
}

export async function sendAdminNotifs(code: string, content: Record<string, any> = {}) {
  return await accountService.sendNotification(await adminService.getAdminIds(), code, content);
}

export function getOrderNotifCode(status: string) {
  switch (status) {
    case Status.PENDING:
      return NotifCode.NEW_ORDER;
    case Status.COMPLETED:
      return NotifCode.ORDER_COMPLETED;
    case Status.CANCELED:
      return NotifCode.ORDER_CANCELED;
    case Status.WAITING:
      return NotifCode.ORDER_WAITING;
    case Status.READY:
      return NotifCode.ORDER_READY;
    case Status.ACCEPTED:
      return NotifCode.ORDER_ACCEPTED;
    case Status.DECLINED:
      return NotifCode.ORDER_DECLINED;
    case Status.VERIFYING:
      return NotifCode.PAYMENT_VERIFYING;
    case Status.VERIFIED:
      return NotifCode.PAYMENT_VERIFIED;
    default:
      return NotifCode.NEW_ORDER;
  }
}

export function formatError(zodError: any) {
  return zodError.error.errors.reduce(
    (acc: any, err: any) => {
      const path = err.path.join('.');
      if (!acc[path]) {
        acc[path] = [];
      }
      acc[path].push(err.message);
      return acc;
    },
    {} as Record<string, string[]>
  );
}

export function formatName(firstName: string, lastName: string) {
  const firstChar = firstName.charAt(0).toUpperCase();
  const restOfName = firstName.slice(1).toLowerCase();
  const lastChar = lastName.charAt(0).toUpperCase();
  const restOfLastName = lastName.slice(1).toLowerCase();
  return `${firstChar}${restOfName} ${lastChar}${restOfLastName}`;
}

export function getCacheKey(req: Request) {
  return uuidv5(req.originalUrl, DNS_NAMESPACE);
}

export function generateCacheKey(accountId: string, req: Request) {
  const key = getCacheKey(req)
  return `${accountId}:${key}`
}

export function extractId(clientd: string) {
  return clientd.split('_')[1];
}

export const fetchImageAsBuffer = async (url: string): Promise<Buffer> => {
  const response = await axios.get(url, { responseType: 'arraybuffer' });
  return Buffer.from(response.data, 'binary');
};

export function arrayWrap(value: any) {
  return Array.isArray(value) ? value : [value];
}

export function generateInitTicketMessage(ticketNumber: string) {
  return `Thanks for submitting your ticket! 🎫 Our team has received it and will get back to you soon. Your ticket is #${ticketNumber}`;
}

export function generateApproveSms(amount: number | string | undefined) {
  return `Your order has been approved, amounting to ₱${amount}. Please send a proof of payment in the dashboard. Link: ${app.appUrl}/order-inventory`;
}

export function realtime(channelName: string, eventName: string, data: Record<string, any>) {
  ablyRest.channels.get(channelName).publish(eventName, data);
}

export function replaceTemplateVars(template: string, data: any) {
  return template.replace(/{{\s*(\w+)\s*}}/g, (match, key) => {
    return key in data ? data[key] : match;
  });
}

export function sanitize(input: string) {
  return validator.escape(input);
}

export function sanitizeAndTrim(input: string | any) {
  return validator.escape(_.trim(input));
}

export const findAppSettings = async (key: string) => {
  const data = await db
    .selectFrom('app_settings')
    .select(['value'])
    .where('key', '=', key)
    .executeTakeFirst();

  return data?.value ?? null;
}

export const logActivity = async ({
  accountId,
  action,
  message,
  meta,
  type,
  typeId
}: Activity) => {

  const data = {
    account_activity_id: IdGenerator.generateUUID(),
    account_id: accountId,
    activity_id: typeId,
    activity_type: type,
    action: action,
    activity_message: message,
    activity_meta: meta,
    created_at: generateDateNow(),
    updated_at: generateDateNow(),
  };

  await db.insertInto('account_activity').values(data).execute();
}

export const getAccountName = async (accountId: string) => {
  const account = await db
    .selectFrom('account')
    .select(['account_first_name', 'account_last_name'])
    .where('account_id', '=', accountId)
    .executeTakeFirstOrThrow(() => new NotFoundException('Account not found.'));

  return formatName(account.account_first_name, account.account_last_name);
};

export const generateAppLink = (link: string) => {
  return process.env.APP_URL + link
};