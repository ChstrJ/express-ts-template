import z from 'zod';

export const productCategorySchema = z.object({
  product_category: z.string().min(1).max(50),
  product_category_status: z.string().default('active').optional()
});

export const updateProductCategorySchema = productCategorySchema.partial();

export type CreateProductCategory = z.infer<typeof productCategorySchema>;
export type UpdateProductCategory = Partial<CreateProductCategory>;
