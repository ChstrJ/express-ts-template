import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { productPackageService } from '@features/product-package/product-package.service';
import { productsService } from '@features/products/products.service';

export const productPackageController = {
  async listProducts(req: Request, res: Response) {
    const { productPackageId } = req.params;

    const { formattedData, meta } = await productsService.listProducts(productPackageId, req.query);

    res.json({ data: formattedData, meta: meta });
  },

  async listAllProductPackages(req: Request, res: Response) {
    const data = await productPackageService.listAllProductPackages();

    res.json({ data: data });
  },

  async getProductPackageDetails(req: Request, res: Response) {
    const productPackageId = req.params.id;

    const productPackage = await productPackageService.getProductPackageDetails(productPackageId);

    res.json({ data: productPackage });
  },

  async createProductPackage(req: Request, res: Response) {
    const data = req.body;
    const file = req.file as Express.Multer.File;

    await productPackageService.createProductPackage(data, file);

    res.status(StatusCodes.CREATED).json({ message: 'Product package created successfully' });
  },

  async updateProductPackage(req: Request, res: Response) {
    const productPackageId = req.params.id;
    const data = req.body;
    const file = req.file as Express.Multer.File;

    await productPackageService.updateProductPackage(productPackageId, data, file);

    res.json({ message: 'Product package updated successfully' });
  },

  async deleteProductPackage(req: Request, res: Response) {
    const productPackageId = req.params.id;

    await productPackageService.deleteProductPackage(productPackageId);

    res.json({ message: 'Product package deleted successfully' });
  }
};
