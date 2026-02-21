import { Role } from '@common/constants/roles';
import { Status } from '@common/constants/status';
import { hashPassword } from '@lib/hash';
import { IdGenerator } from '@utils/id-generator';
import db from 'src/db/db-client';
import fs from 'fs';
import { accountPermissionRepository } from '@features/account-permission/account-permission.repository';

const adminPerms = fs.readFileSync('./src/permissions/admin.json', 'utf-8');

const createAdmin = async () => {
  const data = {
    account_id: IdGenerator.generateUUID(),
    account_email: 'admin@gmail.com',
    account_password: await hashPassword('admin'),
    account_first_name: 'Admin',
    account_last_name: 'Admin',
    account_role: Role.ADMIN,
    account_contact_number: '09123456781',
    account_status: Status.ACTIVE,
    created_at: new Date(),
    updated_at: new Date()
  };

  try {
    await db.insertInto('account').values(data).execute();
    await accountPermissionRepository.insertPermission(data.account_id, JSON.parse(adminPerms));
    console.log('Admin created successfully');
  } catch (error) {
    console.log('Error creating admin', error);
  }
};

const createSuper = async () => {
  const data = {
    account_id: IdGenerator.generateUUID(),
    account_email: 'super@gmail.com',
    account_password: await hashPassword('super'),
    account_first_name: 'super',
    account_last_name: 'super',
    account_role: Role.SUPER_ADMIN,
    account_contact_number: '09123456789',
    account_status: Status.ACTIVE,
    created_at: new Date(),
    updated_at: new Date()
  };

  try {
    await db.insertInto('account').values(data).execute();
    await accountPermissionRepository.insertPermission(data.account_id, JSON.parse(adminPerms));
    console.log('Super created successfully');
  } catch (error) {
    console.log('Error creating super', error);
  }
};

const createCsr = async () => {
  const data = {
    account_id: IdGenerator.generateUUID(),
    account_email: 'csr@gmail.com',
    account_password: await hashPassword('super'),
    account_first_name: 'csr',
    account_last_name: 'csr',
    account_role: Role.CSR,
    account_contact_number: '09123451789',
    account_status: Status.ACTIVE,
    created_at: new Date(),
    updated_at: new Date()
  };

  try {
    await db.insertInto('account').values(data).execute();
    await accountPermissionRepository.insertPermission(data.account_id, JSON.parse(adminPerms));
    console.log('CSR created successfully');
  } catch (error) {
    console.log('Error creating csr', error);
  }
};

createSuper()
  .then(createAdmin)
  .then(createCsr)
  .then(() => {
    process.exit();
  });
