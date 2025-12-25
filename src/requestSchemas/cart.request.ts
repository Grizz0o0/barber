import { z } from 'zod'

export const addToCartSchema = {
  body: z.object({
    product: z.string({ error: 'Product ID là bắt buộc' }).trim().min(1, 'Product ID không được để trống'),
    quantity: z
      .number({ error: 'Số lượng là bắt buộc' })
      .int('Số lượng phải là số nguyên')
      .min(1, 'Số lượng phải lớn hơn 0')
  })
}

export type AddToCartReqBody = z.infer<typeof addToCartSchema.body>

export const updateCartItemSchema = {
  body: z.object({
    product: z.string({ error: 'Product ID là bắt buộc' }).trim().min(1, 'Product ID không được để trống'),
    quantity: z
      .number({ error: 'Số lượng là bắt buộc' })
      .int('Số lượng phải là số nguyên')
      .min(1, 'Số lượng phải lớn hơn 0')
  })
}

export type UpdateCartItemReqBody = z.infer<typeof updateCartItemSchema.body>

export const removeCartItemSchema = {
  params: z.object({
    productId: z.string({ error: 'Product ID là bắt buộc' }).trim().min(1, 'Product ID không được để trống')
  })
}

export type RemoveCartItemReqParams = z.infer<typeof removeCartItemSchema.params>
