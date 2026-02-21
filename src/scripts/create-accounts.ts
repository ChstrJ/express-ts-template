import { Status } from '@common/constants/status';
import { hashPassword } from '@lib/hash';
import { IdGenerator } from '@utils/id-generator';
import db from 'src/db/db-client';
import { faker } from '@faker-js/faker';
import { Role } from '@common/constants/roles';

const createAccounts = async (n: number = 5) => {
  const bulkWrite = [];

  for (let i = 0; i < n; i++) {
    bulkWrite.push({
      account_id: IdGenerator.generateUUID(),
      account_email: faker.internet.email(),
      account_password: await hashPassword('test123123'),
      account_first_name: faker.person.firstName(),
      account_last_name: faker.person.lastName(),
      account_role: Role.DISTRIBUTOR,
      account_contact_number: '09123456789',
      account_status: faker.helpers.arrayElement([Status.ACTIVE, Status.PENDING]),
      created_at: new Date(),
      updated_at: new Date()
    });
  }

  try {
    await db.insertInto('account').values(bulkWrite).execute();
    console.log('Accounts created successfully');
  } catch (error) {
    console.log('Error creating accounts', error);
  }
};

createAccounts(5).then(() => {
  process.exit(1);
});
