import { z } from 'zod'
import { ProductCategory } from '~/constants/product'

export const createProductSchema = {
  body: z.object({
    name: z.string({ error: 'Tên sản phẩm là bắt buộc' }).min(1, 'Tên sản phẩm không được để trống').trim(),
    category: z.nativeEnum(ProductCategory, {
      error: 'Danh mục là bắt buộc'
    }),
    price: z.coerce.number({ error: 'Giá là bắt buộc' }).min(0, 'Giá phải >= 0'),
    stock: z.coerce.number().min(0, 'Kho phải >= 0').default(0),
    description: z.string().optional(),
    images: z.array(z.string()).optional(),
    isActive: z.boolean().default(true)
  })
}

export type CreateProductReqBody = z.infer<typeof createProductSchema.body>

export const updateProductSchema = {
  params: z.object({
    id: z.string().trim().min(1, 'Id không được để trống')
  }),
  body: z.object({
    name: z.string().min(1, 'Tên sản phẩm không được để trống').trim().optional(),
    category: z.nativeEnum(ProductCategory).optional(),
    price: z.coerce.number().min(0, 'Giá phải >= 0').optional(),
    stock: z.coerce.number().min(0, 'Kho phải >= 0').optional(),
    description: z.string().optional(),
    images: z.array(z.string()).optional(),
    isActive: z.boolean().optional()
  })
}

export type UpdateProductReqBody = z.infer<typeof updateProductSchema.body>
export type UpdateProductReqParams = z.infer<typeof updateProductSchema.params>

export const deleteProductSchema = {
  params: z.object({
    id: z.string().trim().min(1, 'Id không được để trống')
  })
}

export type DeleteProductReqParams = z.infer<typeof deleteProductSchema.params>

export const getProductByIdSchema = {
  params: z.object({
    id: z.string().trim().min(1, 'Id không được để trống')
  })
}

export type GetProductByIdReqParams = z.infer<typeof getProductByIdSchema.params>

export const getListProductSchema = {
  query: z.object({
    limit: z.coerce.number().int().positive().optional(),
    page: z.coerce.number().int().positive().optional(),
    order: z.enum(['asc', 'desc']).optional(),
    sortBy: z.enum(['createdAt', 'price', 'name', 'stock']).optional(),
    category: z.nativeEnum(ProductCategory).optional(),
    search: z.string().optional(),
    isActive: z.enum(['true', 'false']).optional() // For filtering active/inactive
  })
}

export type GetListProductQuery = z.infer<typeof getListProductSchema.query>
