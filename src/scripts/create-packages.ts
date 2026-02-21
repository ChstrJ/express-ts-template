import { Status } from '@common/constants/status';
import { IdGenerator } from '@utils/id-generator';
import db from 'src/db/db-client';
import { faker } from '@faker-js/faker';

const seedPackages = async (n: number) => {
  console.log(`Creating ${n} product packages...`);
  const category = await db.selectFrom('product_category').selectAll().executeTakeFirst();

  for (let i = 0; i < n; i++) {
    const data = {
      product_package_id: IdGenerator.generateUUID(),
      product_package_name: faker.helpers.arrayElement(['BBQ Package', 'Party Package', 'Family Package']),
      product_package_description: faker.food.description(),
      product_package_price: String(faker.number.float({ min: 20000, max: 40000, fractionDigits: 2 })),
      product_package_status: Status.ACTIVE,
      created_at: new Date(),
      updated_at: new Date()
    };

    const productData = {
      product_id: IdGenerator.generateUUID(),
      product_name: faker.commerce.productName(),
      product_description: faker.commerce.productDescription(),
      product_price: String(faker.number.float({ min: 1000, max: 5000, fractionDigits: 2 })),
      product_category_id: category?.product_category_id,
      product_stock: faker.number.int({ min: 10, max: 100 }),
      product_pv: String(faker.number.int({ min: 100, max: 500 })),
      product_status: Status.ACTIVE,
      created_at: new Date(),
      updated_at: new Date()
    };

    const pivotData = {
      product_package_product_id: IdGenerator.generateUUID(),
      product_id: productData.product_id,
      product_package_id: data.product_package_id,
      created_at: new Date(),
      updated_at: new Date()
    };

    try {
      await db.insertInto('product_package').values(data).execute();
      await db.insertInto('product').values(productData).execute();
      await db.insertInto('product_package_product').values(pivotData).execute();
    } catch (error) {
      console.log(error);
      console.log('Error creating packages and products', error);
    }
  }

  console.log('Done creating packagess...');
};

seedPackages(1).then(() => {
  process.exit(1);
});
