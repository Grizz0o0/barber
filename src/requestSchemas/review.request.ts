import { z } from 'zod'

export const createReviewSchema = {
  body: z
    .object({
      product: z.string().optional(),
      booking: z.string().optional(),
      rating: z.number().int().min(1).max(5),
      comment: z.string().optional(),
      images: z.array(z.string()).optional()
    })
    .refine((data) => data.product || data.booking, {
      message: 'Phải chọn đánh giá cho Sản phẩm hoặc Lịch đặt',
      path: ['product', 'booking']
    })
}

export type CreateReviewReqBody = z.infer<typeof createReviewSchema.body>

export const updateReviewSchema = {
  params: z.object({
    id: z.string().trim().min(1)
  }),
  body: z.object({
    rating: z.number().int().min(1).max(5).optional(),
    comment: z.string().optional(),
    images: z.array(z.string()).optional()
  })
}

export type UpdateReviewReqBody = z.infer<typeof updateReviewSchema.body>

export const replyReviewSchema = {
  params: z.object({
    id: z.string().trim().min(1)
  }),
  body: z.object({
    reply: z.string().min(1, 'Nội dung phản hồi không được trống')
  })
}

export type ReplyReviewReqBody = z.infer<typeof replyReviewSchema.body>

export const getReviewSchema = {
  query: z.object({
    limit: z.coerce.number().int().positive().optional(),
    page: z.coerce.number().int().positive().optional(),
    rating: z.coerce.number().int().min(1).max(5).optional(),
    product: z.string().optional(),
    booking: z.string().optional(),
    hasReply: z.enum(['true', 'false']).optional()
  })
}

export type GetReviewQuery = z.infer<typeof getReviewSchema.query>
