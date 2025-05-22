import { v4 as uuidv4 } from 'uuid';
import { nanoid } from 'nanoid';

export class IdGenerator {
  protected length = 24;

  static generateUUID() {
    return uuidv4();
  }

  static generateShortUUID({
    length = this.length,
    prefix = '',
  }: { length?: number; prefix?: string } = {}) {
    const formatNanoid = nanoid(length).replace(/[_-]/g, '');
    return prefix ? `${prefix}_${formatNanoid}` : formatNanoid;
  }

  static nanoid(length: number = this.length) {
    return nanoid(length);
  }
}
