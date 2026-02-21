import { Account } from '../generated/generated-types';

export type InsertAccount = Omit<Account, 'account_id' | 'created_at' | 'updated_at'>;
