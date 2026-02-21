import { Request, Response } from 'express';
import { productsService } from '@features/products/products.service';
import { StatusCodes } from 'http-status-codes';

export const productsController = {
  async getProducts(req: Request, res: Response) {
    const { data, meta } = await productsService.getProducts(req.query, true);

    res.json({ data: data, meta: meta });
  },

  async getProductsPackage(req: Request, res: Response) {
    const data = await productsService.getProductsPackage();
    res.json({ data: data });
  },

  async createProduct(req: Request, res: Response) {
    const data = req.body;
    const file = req.file as Express.Multer.File;
    const { account_id: adminId } = req.user;

    const results = await productsService.createProduct(adminId, data, file);

    res.status(StatusCodes.CREATED).json({ data: results });
  },

  async updateProduct(req: Request, res: Response) {
    const { productId } = req.params;
    const { account_id: adminId } = req.user;
    const data = req.body;
    const file = req.file as Express.Multer.File;

    const results = await productsService.updateProduct(adminId, productId, data, file);

    res.json({ data: results });
  },

  async updateProductStock(req: Request, res: Response) {
    const { productId } = req.params;
    const { account_id: adminId } = req.user;
    const { product_stock } = req.body;

    const results = await productsService.updateProductStock(adminId, productId, product_stock);

    res.json({ data: results });
  },


  async listPackageUnderProduct(req: Request, res: Response) {
    const { productId } = req.params;

    const results = await productsService.listPackagesUnderProduct(productId);

    res.json({ data: results });
  },

  async deleteProduct(req: Request, res: Response) {
    const { productId } = req.params;
    const { account_id: adminId } = req.user;

    const results = await productsService.deleteProduct(adminId, productId);

    res.json({ data: results });
  }
};
