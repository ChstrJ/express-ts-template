import { Account } from "@prisma/client";

type AccountDTO = {
  account_id: string;
  account_first_name: string;
  account_last_name: string;
  account_email: string;
  account_contact_number: string;
}

export function toAccountDTO(account: Account) {

}
