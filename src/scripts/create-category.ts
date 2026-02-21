import { IdGenerator } from '@utils/id-generator';
import db from 'src/db/db-client';
import { faker } from '@faker-js/faker';
import { Status } from '@common/constants/status';

const seedCategory = async (n: number) => {
  console.log(`Creating ${n} product categories...`);
  for (let i = 0; i < n; i++) {
    const data = {
      product_category_id: IdGenerator.generateUUID(),
      product_category: faker.helpers.arrayElement(['Food', 'Health', 'Technology']),
      product_category_status: Status.ACTIVE,
      created_at: new Date(),
      updated_at: new Date()
    };

    try {
      await db.insertInto('product_category').values(data).execute();
    } catch (error) {
      console.log(error);
      console.log('Error categories', error);
    }
  }

  console.log('Done creating categories...');
};

seedCategory(3).then(() => {
  process.exit(1);
});
