import { IdGenerator } from '@utils/id-generator';
import db from 'src/db/db-client';
import { generateDateNow } from '@utils/helpers';
import { BadRequestException, NotFoundException } from '@utils/errors';
import { CreateProductCategory, UpdateProductCategory } from '@common/schema/category';
import { Status } from '@common/constants/status';

export const productCategoryService = {
  async createProductCategory(data: CreateProductCategory) {
    await db
      .insertInto('product_category')
      .values({
        product_category_id: IdGenerator.generateUUID(),
        product_category: data.product_category,
        product_category_status: data.product_category_status,
        created_at: generateDateNow(),
        updated_at: generateDateNow()
      })
      .execute();

    return true;
  },

  async getAllProductCategories() {
    const categories = await db
      .selectFrom('product_category')
      .select(['product_category_id', 'product_category', 'product_category_status'])
      .where('product_category_status', '=', Status.ACTIVE)
      .execute();

    return categories.map((category) => {
      return {
        category_id: category.product_category_id,
        category_name: category.product_category,
        category_status: category.product_category_status
      };
    });
  },

  async getProductCategoryById(id: string) {
    const category = await db
      .selectFrom('product_category')
      .selectAll()
      .where('product_category_id', '=', id)
      .executeTakeFirstOrThrow(() => new NotFoundException('Product category not found'));

    return category;
  },

  async updateProductCategory(id: string, data: UpdateProductCategory) {
    await this.getProductCategoryById(id);

    await db.updateTable('product_category').set(data).where('product_category_id', '=', id).execute();

    return true;
  },

  async deleteProductCategory(id: string) {
    await this.getProductCategoryById(id);

    const associatedProducts = await db
      .selectFrom('product')
      .select(['product_id'])
      .where('product_category_id', '=', id)
      .executeTakeFirst();

    if (associatedProducts) {
      throw new BadRequestException('Cannot delete category with associated products.');
    }

    await db.deleteFrom('product_category').where('product_category_id', '=', id).execute();

    return true;
  }
};
