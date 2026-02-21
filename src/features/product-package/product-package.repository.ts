import { Status } from '@common/constants/status';
import { NotFoundException } from '@utils/errors';
import db from 'src/db/db-client';

export const productPackageRepository = {
  async getAllProductsPackageForPublic() {
    return await db.selectFrom('product_package').selectAll().where('product_package_status', '=', Status.ACTIVE).orderBy('created_at', 'desc').execute();
  },

  async getAllProductsPackage() {
    return await db.selectFrom('product_package').selectAll().orderBy('created_at', 'desc').execute();
  },

  async findProductPackageById(productPackageId: string) {
    return await db
      .selectFrom('product_package')
      .select(['product_package_id', 'product_package_name', 'product_package_price', 'product_package_image', 'product_package_description'])
      .where('product_package_id', '=', productPackageId)
      .executeTakeFirstOrThrow(() => new NotFoundException('Product package not found.'));
  },

  async deleteProductPackageById(productPackageId: string) {
    await db
      .updateTable('product_package')
      .set({
        product_package_status: Status.INACTIVE
      })
      .where('product_package_id', '=', productPackageId)
      .execute();

    await db.deleteFrom('product_package__product')
      .where('product_package_id', '=', productPackageId)
      .execute();

    return true;
  },

  async updateProductPackageById(productPackageId: string, data: any) {
    await db.updateTable('product_package').set(data).where('product_package_id', '=', productPackageId).execute();

    return true;
  },

  async insertProductPackage(data: any) {
    await db.insertInto('product_package').values(data).execute();

    return true;
  }
};
