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
    account_type: string;
    account_status: Generated<string>;
    account_contact_number: string;
    account_permissions: Generated<unknown | null>;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp;
};
export type DB = {
    account: Account;
};
