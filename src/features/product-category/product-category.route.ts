import { Router } from 'express';
import { productCategoryController } from './product-category.controller';
import { validateRequest } from '@middlewares/validator';
import { productCategorySchema, updateProductCategorySchema } from '@common/schema/category';

const router = Router();

router.post('/', validateRequest(productCategorySchema), productCategoryController.createProductCategory);
router.get('/', productCategoryController.getAllProductCategories);
router.get('/:id', productCategoryController.getProductCategoryById);
router.patch('/:id', validateRequest(updateProductCategorySchema), productCategoryController.updateProductCategory);
router.delete('/:id', productCategoryController.deleteProductCategory);

export default router;
