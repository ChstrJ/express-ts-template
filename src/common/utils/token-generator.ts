import { v5 as uuidv5 } from 'uuid';

const DNS_NAMESPACE = uuidv5.DNS;

export class TokenGenerator {
  static uuid(value: string) {
    return uuidv5(value, DNS_NAMESPACE);
  }
}
