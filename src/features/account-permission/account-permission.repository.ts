import { generateDateNow } from '@utils/helpers';
import { IdGenerator } from '@utils/id-generator';
import _ from 'lodash';
import db from 'src/db/db-client';

export const accountPermissionRepository = {
  async createAccountPermission(accountId: string, type: string) {
    const permission = await db.selectFrom('permission').where('permission_type', '=', type).selectAll().executeTakeFirst();

    if (!permission) {
      return;
    }

    const data = {
      account_permission_id: IdGenerator.generateUUID(),
      account_id: accountId,
      permission_meta: permission.permission_meta,
      created_at: new Date(),
      updated_at: new Date()
    };

    await db.insertInto('account_permission').values(data).execute();
  },

  async insertPermission(accountId: string, permission: any) {
    const data = {
      account_permission_id: IdGenerator.generateUUID(),
      account_id: accountId,
      created_at: generateDateNow(),
      updated_at: generateDateNow(),
      permission_meta: JSON.stringify(permission)
    };

    await db.insertInto('account_permission').values(data).execute();
  },

  async updatePermission(accountId: string, permission: any) {
    const currentPermission = await db.selectFrom('account_permission').select(['permission_meta']).where('account_id', '=', accountId).executeTakeFirstOrThrow();

    const mergedPermission = _.merge({}, currentPermission?.permission_meta, permission);

    const data = {
      permission_meta: JSON.stringify(mergedPermission),
      updated_at: generateDateNow()
    };

    await db.updateTable('account_permission').set(data).where('account_id', '=', accountId).execute();
  }
};
