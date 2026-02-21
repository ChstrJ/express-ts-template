import { Role } from '@common/constants/roles';
import { Status } from '@common/constants/status';
import { IdGenerator } from '@utils/id-generator';
import db from 'src/db/db-client';
import fs from 'fs';

const adminPerms = fs.readFileSync('./src/permissions/admin.json', 'utf-8');

const createPermissions = async () => {
  const data = {
    permission_id: IdGenerator.generateUUID(),
    permission_type: Role.ADMIN,
    permission_status: Status.ACTIVE,
    permission_meta: adminPerms,
    created_at: new Date(),
    updated_at: new Date()
  };

  try {
    await db.insertInto('permission').values(data).execute();
    console.log('Permissions created successfully');
  } catch (error) {
    console.log('Error creating permissions', error);
  }
};

createPermissions().then(() => {
  process.exit(1);
});
