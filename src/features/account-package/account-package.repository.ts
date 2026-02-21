import { IdGenerator } from '@utils/id-generator';
import db from 'src/db/db-client';

export const accountPackageRepository = {
  async insertAccountPackage(accountId: string, data: Record<string, string | any>): Promise<void> {
    await db
      .insertInto('account_product_package')
      .values({
        account_product_package_id: IdGenerator.generateUUID(),
        account_id: accountId,
        product_package_id: data.product_package_id,
        product_package_price: data.product_package_price,
        created_at: new Date(),
        updated_at: new Date()
      })
      .execute();
  }
};
