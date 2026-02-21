import { Request, Response } from 'express';
import { productCategoryService } from './product-category.service';

export const productCategoryController = {
  async createProductCategory(req: Request, res: Response) {
    await productCategoryService.createProductCategory(req.body);
    res.status(201).json({ message: 'Product category created successfully' });
  },

  async getAllProductCategories(req: Request, res: Response) {
    const categories = await productCategoryService.getAllProductCategories();

    res.json({ data: categories });
  },

  async getProductCategoryById(req: Request, res: Response) {
    const { id } = req.params;
    const category = await productCategoryService.getProductCategoryById(id);
    res.json({ data: category });
  },

  async updateProductCategory(req: Request, res: Response) {
    const { id } = req.params;
    await productCategoryService.updateProductCategory(id, req.body);
    res.json({ message: 'Product category updated successfully' });
  },

  async deleteProductCategory(req: Request, res: Response) {
    const { id } = req.params;
    await productCategoryService.deleteProductCategory(id);
    res.json({ message: 'Product category deleted successfully' });
  }
};
