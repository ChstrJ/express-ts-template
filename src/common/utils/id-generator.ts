import { v4 as uuidv4 } from 'uuid';
import { nanoid } from 'nanoid';

export class IdGenerator {
  protected static defaultLength = 24;

  static generateUUID() {
    return uuidv4();
  }

  static generateNanoidWithPrefix({
    length = IdGenerator.defaultLength,
    prefix = '',
  }: { length?: number; prefix?: string } = {}) {
    const formatNanoid = nanoid(length).replace(/[_-]/g, '');
    return prefix ? `${prefix}_${formatNanoid}` : formatNanoid;
  }

  static nanoid(length: number = IdGenerator.defaultLength) {
    return nanoid(length);
  }
}
