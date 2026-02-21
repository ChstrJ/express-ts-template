import { Router } from 'express';
import { productsController } from './products.controller';
import { validateRequest } from '@middlewares/validator';
import { productCreateSchema, productsStockSchema, updateProductSchema } from '@common/schema/products';
import { uploadAndProcessFile } from '@middlewares/upload-image';

const router = Router();

router.get('/', productsController.getProducts);
router.delete('/:productId', productsController.deleteProduct);
router.get('/:productId/packages', productsController.listPackageUnderProduct);

router.patch('/:productId', uploadAndProcessFile('image'), validateRequest(updateProductSchema), productsController.updateProduct);
router.patch('/:productId/stock', validateRequest(productsStockSchema), productsController.updateProductStock);
router.post('/', uploadAndProcessFile('image'), validateRequest(productCreateSchema), productsController.createProduct);

export default router;
