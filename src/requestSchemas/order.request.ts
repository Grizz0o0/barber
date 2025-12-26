import { z } from 'zod'

export const createOrderSchema = {
  body: z.object({
    items: z
      .array(
        z.object({
          product: z.string({ error: 'Product ID là bắt buộc' }).trim().min(1),
          quantity: z.number().int().positive()
        })
      )
      .min(1, 'Đơn hàng phải có ít nhất 1 sản phẩm'),
    shippingAddress: z.object({
      street: z.string({ error: 'Đường/Phố là bắt buộc' }).trim().min(1),
      district: z.string().optional(),
      city: z.string({ error: 'Thành phố là bắt buộc' }).trim().min(1),
      country: z.string().default('Vietnam')
    }),
    paymentMethod: z.enum(['Cash', 'MoMo', 'Banking']).default('Cash'),
    promotion: z.string().optional()
  })
}

export type CreateOrderReqBody = z.infer<typeof createOrderSchema.body>

export const updateOrderSchema = {
  params: z.object({
    id: z.string().trim().min(1, 'Id không được để trống')
  }),
  body: z.object({
    status: z.enum(['pending_payment', 'processing', 'shipped', 'delivered', 'cancelled']).optional(),
    shippingAddress: z
      .object({
        street: z.string().trim().min(1).optional(),
        district: z.string().optional(),
        city: z.string().trim().min(1).optional(),
        country: z.string().optional()
      })
      .optional()
  })
}

export type UpdateOrderReqBody = z.infer<typeof updateOrderSchema.body>
export type UpdateOrderReqParams = z.infer<typeof updateOrderSchema.params>

export const deleteOrderSchema = {
  params: z.object({
    id: z.string().trim().min(1, 'Id không được để trống')
  })
}

export type DeleteOrderReqParams = z.infer<typeof deleteOrderSchema.params>

export const getOrderSchema = {
  query: z.object({
    limit: z.coerce.number().int().positive().optional(),
    page: z.coerce.number().int().positive().optional(),
    order: z.enum(['asc', 'desc']).optional(),
    sortBy: z.enum(['createdAt', 'totalPrice', 'status']).optional(),
    status: z.enum(['pending_payment', 'processing', 'shipped', 'delivered', 'cancelled']).optional(),
    user: z.string().optional()
  })
}

export type GetOrderQuery = z.infer<typeof getOrderSchema.query>
