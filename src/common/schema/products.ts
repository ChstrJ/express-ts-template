import { z } from 'zod';
import { imageSchema } from './multipart';

export const productPackage = z.object({
  package_name: z.string({ required_error: 'Package name is required.' }).nonempty().min(1).max(50),
  package_description: z.string({ required_error: 'Product description is required.' }).min(1),
  package_price: z.coerce.number({ required_error: 'Product price is required.' }).positive('Product package price must be a positive number'),
  package_status: z.enum(['active', 'inactive']).default('active')
});

export const productPackageSchema = productPackage.merge(imageSchema);

export const updateProductPackageSchema = productPackageSchema.partial();

const productPackageId = z.object({
  package_id: z.string({ required_error: 'Package ID is required.' }).nonempty('Package ID is required.')
});

export const productsSchema = z.object({
  package_ids: z.array(z.string({ required_error: 'Package ID is required.' }).nonempty('Package ID is required.')).min(1),
  d_package_ids: z.array(z.string({ required_error: 'Package ID is required.' }).nonempty('Package ID is required.')).optional(),
  product_name: z.string({ required_error: 'Product name is required.' }).nonempty().min(1).max(50),
  product_description: z.string({ required_error: 'Product description is required.' }).nonempty().min(1),
  product_stock: z.coerce.number({ required_error: 'Product stock is required.' }).positive('Product stock must be a positive number').min(1).max(999999),
  threshold_qty: z.coerce.number({ required_error: 'Low stock trigger is required.' }).positive('Product stock must be a positive number').min(1).max(999999).optional(),
  product_price: z.coerce.number({ required_error: 'Product price is required.' }).positive('Product price must be a positive number').min(1).max(999999),
  product_status: z.enum(['active', 'inactive']).default('active'),
  product_pv: z.coerce.number({ required_error: 'Product PV is required.' }).positive('Product PV must be a positive number').min(1).max(999999),
  category_id: z.string({ required_error: 'Category ID is required.' }).nonempty()
});

export const productsStockSchema = z.object({
  product_stock: z.coerce.number({ required_error: 'Product stock is required.' }).positive('Product stock must be a positive number').min(1).max(999999),
});

export const productCreateSchema = productsSchema.merge(imageSchema);

export const updateProductSchema = productsSchema.partial();

export type CreateProduct = z.infer<typeof productCreateSchema>;
export type UpdateProduct = z.infer<typeof updateProductSchema>;
