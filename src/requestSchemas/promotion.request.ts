import { z } from 'zod'

export const createPromotionSchema = {
  body: z
    .object({
      code: z.string({ error: 'Mã khuyến mãi là bắt buộc' }).trim().min(3, 'Mã phải có ít nhất 3 ký tự').toUpperCase(),
      discountPercent: z.number().min(0).max(100).optional(),
      discountValue: z.number().min(0).optional(),
      maxDiscountValue: z.number().min(0).optional(),
      minOrderValue: z.number().min(0).optional().default(0),
      expiryDate: z.string({ error: 'Ngày hết hạn là bắt buộc' }).datetime(),
      maxUsage: z.number().int().min(1).optional(),
      applicableTo: z.enum(['product', 'service', 'all']).default('all'),
      isActive: z.boolean().optional().default(true)
    })
    .refine((data) => new Date(data.expiryDate) > new Date(), {
      message: 'Ngày hết hạn phải lớn hơn thời điểm hiện tại',
      path: ['expiryDate']
    })
}

export type CreatePromotionReqBody = z.infer<typeof createPromotionSchema.body>

export const updatePromotionSchema = {
  params: z.object({
    id: z.string().trim().min(1, 'Id không được để trống')
  }),
  body: z
    .object({
      code: z.string().trim().min(3).toUpperCase().optional(),
      discountPercent: z.number().min(0).max(100).optional(),
      discountValue: z.number().min(0).optional(),
      maxDiscountValue: z.number().min(0).optional(),
      minOrderValue: z.number().min(0).optional(),
      expiryDate: z.string().datetime().optional(),
      maxUsage: z.number().int().min(1).optional(),
      applicableTo: z.enum(['product', 'service', 'all']).optional(),
      isActive: z.boolean().optional()
    })
    .refine(
      (data) => {
        if (data.expiryDate) {
          return new Date(data.expiryDate) > new Date()
        }
        return true
      },
      {
        message: 'Ngày hết hạn phải lớn hơn thời điểm hiện tại',
        path: ['expiryDate']
      }
    )
}

export type UpdatePromotionReqBody = z.infer<typeof updatePromotionSchema.body>
export type UpdatePromotionReqParams = z.infer<typeof updatePromotionSchema.params>

export const deletePromotionSchema = {
  params: z.object({
    id: z.string().trim().min(1, 'Id không được để trống')
  })
}

export const getPromotionSchema = {
  query: z.object({
    limit: z.coerce.number().int().positive().optional(),
    page: z.coerce.number().int().positive().optional(),
    code: z.string().optional(),
    isActive: z.enum(['true', 'false']).optional(),
    applicableTo: z.enum(['product', 'service', 'all']).optional()
  })
}

export type GetPromotionQuery = z.infer<typeof getPromotionSchema.query>
