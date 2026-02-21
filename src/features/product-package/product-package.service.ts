import { BadRequestException, NotFoundException } from '@utils/errors';
import { productPackageRepository } from './product-package.repository';
import _, { result } from 'lodash';
import { IdGenerator } from '@utils/id-generator';
import logger from '@utils/logger';
import { deleteFile, uploadFile } from '@lib/r2';
import { generateDateNow, generateImageKey, getImageUrl } from '@utils/helpers';
import db from 'src/db/db-client';
import { Status } from '@common/constants/status';

export const productPackageService = {
  async listAllProductPackages() {
    const results = await productPackageRepository.getAllProductsPackageForPublic();

    const formattedResults = results.map((result) => {
      return {
        package_id: result.product_package_id,
        package_name: result.product_package_name,
        package_description: result.product_package_description,
        package_price: result.product_package_price,
        package_status: result.product_package_status,
        package_image: getImageUrl(result.product_package_image),
      };
    });

    return formattedResults;
  },

  async getProductPackageDetails(productPackageId: string) {
    const productPackage = await productPackageRepository.findProductPackageById(productPackageId);

    const results = await db.selectFrom('product_package as pp')
      .innerJoin('product_package__product as p2p', 'pp.product_package_id', 'p2p.product_package_id')
      .innerJoin('product as p', 'p2p.product_id', 'p.product_id')
      .innerJoin('product_category as pc', 'p.product_category_id', 'pc.product_category_id')
      .select([
        'p.product_id',
        'p.product_name',
        'p.product_price',
        'pc.product_category',
        'p.product_pv',
        'p.product_image'
      ])
      .where('pp.product_package_id', '=', productPackageId)
      .where('pp.product_package_status', '=', Status.ACTIVE)
      .where('p.product_status', '=', Status.ACTIVE)
      .execute();

    return {
      package: {
        ...productPackage,
        product_package_image: getImageUrl(productPackage.product_package_image)
      },
      products: results ? results.map((result) => ({
        ...result,
        product_image: getImageUrl(result.product_image)
      })) : []
    }
  },

  async createProductPackage(data: any, file: Express.Multer.File) {
    let insertData = {
      product_package_id: IdGenerator.generateUUID(),
      product_package_name: data.package_name,
      product_package_description: data.package_description,
      product_package_price: data.package_price,
      updated_at: new Date(),
      created_at: new Date()
    };

    if (file) {
      const image = await uploadFile(generateImageKey('pp'), file);

      insertData = _.assign(insertData, { product_package_image: image?.file_key });
    }

    await productPackageRepository.insertProductPackage(insertData);

    return true;
  },

  async updateProductPackage(productPackageId: string, data: any, file: Express.Multer.File) {
    const productPackage = await this.checkProductPackageExists(productPackageId);

    let updateData = {
      product_package_name: data.package_name,
      product_package_description: data.package_description,
      product_package_price: data.package_price,
      updated_at: generateDateNow()
    };

    try {
      if (!_.isEmpty(file)) {
        await deleteFile(productPackage.product_package_image ?? '');
        const image = await uploadFile(generateImageKey('pp'), file);

        updateData = _.assign(updateData, { product_package_image: image?.file_key });
      }

      await productPackageRepository.updateProductPackageById(productPackageId, updateData);
    } catch (error) {
      logger.error(error);
      throw new BadRequestException('Failed to update product package');
    }

    return true;
  },

  async deleteProductPackage(productPackageId: string) {
    const productPackage = await this.checkProductPackageExists(productPackageId);

    try {
      if (!_.isEmpty(productPackage.product_package_image)) {
        await deleteFile(productPackage.product_package_image);
      }

      await productPackageRepository.deleteProductPackageById(productPackageId);
    } catch (err) {
      logger.error(err);
      throw new BadRequestException('Failed to delete product package');
    }

    return true;
  },

  async checkProductPackageExists(productPackageId: string) {
    const productPackage = await productPackageRepository.findProductPackageById(productPackageId);

    if (_.isEmpty(productPackage)) {
      throw new NotFoundException('Product package not found');
    }

    return productPackage;
  }
};
