import { Router } from 'express';
import { productPackageController } from '@features/product-package/product-package.controller';
import { validateRequest } from '@middlewares/validator';
import { productPackageSchema, updateProductPackageSchema } from '@common/schema/products';
import { adminMiddleware } from '@middlewares/admin';
import { authenticationMiddleware } from '@middlewares/authentication';
import { uploadAndProcessFile } from '@middlewares/upload-image';

const router = Router();

router.get('/', productPackageController.listAllProductPackages);

router.get('/:id', productPackageController.getProductPackageDetails);
router.get('/:productPackageId/products', productPackageController.listProducts);

router.use(authenticationMiddleware);
router.use(adminMiddleware);
router.post('/', uploadAndProcessFile('image'), validateRequest(productPackageSchema), productPackageController.createProductPackage);
router.delete('/:id', productPackageController.deleteProductPackage);
router.patch('/:id', uploadAndProcessFile('image'), validateRequest(updateProductPackageSchema), productPackageController.updateProductPackage);

export default router;
